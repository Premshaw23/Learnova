import { GET } from '@/app/api/cron/attendance-warnings/route';
import { connectDb } from '@/lib/mongodb';
import { initializeFirebase } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/mongodb', () => ({
  connectDb: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  initializeFirebase: vi.fn(),
}));

vi.mock('firebase-admin', () => {
  const firestoreFn = vi.fn();
  return {
    default: {
      firestore: firestoreFn,
    },
    firestore: firestoreFn,
  };
});

describe('Cron Job: Attendance Warnings', () => {
  let mockDb;
  let settingsCollection;
  let usersCollection;
  let notificationsCollection;
  let warningLogsCollection;
  let attendanceCollection;
  let mockFirestore;

  const createCursor = (result) => {
    const cursor = vi.fn();
    cursor.project = vi.fn().mockReturnValue(cursor);
    cursor.toArray = vi.fn().mockResolvedValue(result);
    cursor.forEach = vi.fn();
    return cursor;
  };

  beforeEach(() => {
    const emptyCursor = createCursor([]);
    settingsCollection = {
      find: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    };
    usersCollection = {
      find: vi.fn().mockReturnValue(emptyCursor),
      toArray: vi.fn().mockResolvedValue([]),
    };
    notificationsCollection = {
      insertMany: vi.fn(),
    };
    warningLogsCollection = {
      find: vi.fn().mockReturnValue(emptyCursor),
      findOne: vi.fn().mockResolvedValue(null),
      insertMany: vi.fn(),
    };
    attendanceCollection = {
      find: vi.fn().mockReturnValue(emptyCursor),
      toArray: vi.fn().mockResolvedValue([]),
    };

    mockFirestore = {
      collection: vi.fn(() => ({})),
    };

    admin.firestore.mockReturnValue(mockFirestore);

    mockDb = {
      collection: vi.fn((name) => {
        switch (name) {
          case 'settings': return settingsCollection;
          case 'users': return usersCollection;
          case 'notifications': return notificationsCollection;
          case 'warning_logs': return warningLogsCollection;
          case 'attendance': return attendanceCollection;
          default: return {};
        }
      }),
    };

    connectDb.mockResolvedValue(mockDb);
    process.env.CRON_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = (secret = 'test-secret') => {
    return {
      headers: new Headers({
        authorization: `Bearer ${secret}`
      })
    };
  };

  it('should return 401 if unauthorized', async () => {
    const res = await GET(mockRequest('wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('should return early if automation is not enabled', async () => {
    settingsCollection.toArray.mockResolvedValue([]);
    const res = await GET(mockRequest());
    const data = await res.json();
    expect(data.message).toContain('Automation is not enabled');
  });

  it('should generate warnings for students below threshold', async () => {
    const instituteId = 'inst-1';

    // Mock: pre-fetch all students with instituteId
    const studentsCursor = createCursor([
      { firebaseUid: 'student-1', uid: 'student-1', instituteId, email: 's1@test.com', name: 'Student 1', role: 'student' },
      { firebaseUid: 'student-2', uid: 'student-2', instituteId, email: 's2@test.com', name: 'Student 2', role: 'student' },
    ]);
    usersCollection.find.mockReturnValue(studentsCursor);

    // Mock: settings
    settingsCollection.toArray.mockResolvedValue([
      { userId: instituteId, instituteId, institute: { enableAttendanceAutomation: true, lowAttendanceThreshold: 75 } }
    ]);

    // Mock: attendance records (scoped by institute) — returned by cursor from find()
    const attendanceCursor = createCursor([
      { userId: 'student-1', status: 'present', instituteId },
      { userId: 'student-1', status: 'absent', instituteId },
      { userId: 'student-2', status: 'present', instituteId },
      { userId: 'student-2', status: 'present', instituteId },
    ]);
    attendanceCollection.find.mockReturnValue(attendanceCursor);

    const res = await GET(mockRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.warningsIssued).toBe(1);
    expect(notificationsCollection.insertMany).toHaveBeenCalledTimes(1);
    
    const insertedNotifications = notificationsCollection.insertMany.mock.calls[0][0];
    expect(insertedNotifications.length).toBe(1);
    expect(insertedNotifications[0].userId).toBe('student-1');
  });

  it('should not generate warnings if a warning was recently issued', async () => {
    const instituteId = 'inst-1';

    // Mock: pre-fetch all students with instituteId
    const studentsCursor = createCursor([
      { firebaseUid: 'student-1', uid: 'student-1', instituteId, email: 's1@test.com', name: 'Student 1', role: 'student' },
    ]);
    usersCollection.find.mockReturnValue(studentsCursor);

    // Mock: settings
    settingsCollection.toArray.mockResolvedValue([
      { userId: instituteId, instituteId, institute: { enableAttendanceAutomation: true, lowAttendanceThreshold: 75 } }
    ]);

    // Mock: warning log shows recent warning for student-1
    const warningLogFindOne = vi.fn().mockResolvedValue({ userId: 'student-1' });
    warningLogsCollection.findOne = warningLogFindOne;

    const res = await GET(mockRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.warningsIssued).toBe(0);
    expect(notificationsCollection.insertMany).not.toHaveBeenCalled();
  });

  it('should skip if no students in institute', async () => {
    const instituteId = 'inst-1';

    // Mock: pre-fetch returns no students for this institute
    const studentsCursor = createCursor([
      { firebaseUid: 'student-other', uid: 'student-other', instituteId: 'other-inst', email: 's3@test.com', name: 'Student 3', role: 'student' },
    ]);
    usersCollection.find.mockReturnValue(studentsCursor);

    // Mock: settings
    settingsCollection.toArray.mockResolvedValue([
      { userId: instituteId, instituteId, institute: { enableAttendanceAutomation: true, lowAttendanceThreshold: 75 } }
    ]);

    const res = await GET(mockRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.warningsIssued).toBe(0);
    expect(notificationsCollection.insertMany).not.toHaveBeenCalled();
  });
});
