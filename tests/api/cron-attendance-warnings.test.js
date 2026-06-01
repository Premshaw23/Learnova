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

vi.mock('firebase-admin', () => ({
  default: {
    firestore: vi.fn(),
  },
}));

describe('Cron Job: Attendance Warnings', () => {
  let mockDb;
  let settingsCollection;
  let usersCollection;
  let notificationsCollection;
  let warningLogsCollection;
  let mockFirestore;
  let mockAttendanceCollection;

  beforeEach(() => {
    settingsCollection = {
      find: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    };
    usersCollection = {
      find: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    };
    notificationsCollection = {
      insertMany: vi.fn(),
    };
    warningLogsCollection = {
      findOne: vi.fn(),
      insertMany: vi.fn(),
    };

    mockAttendanceCollection = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn(),
    };

    mockFirestore = {
      collection: vi.fn((name) => {
        if (name === 'attendance_records') return mockAttendanceCollection;
        return {};
      }),
    };

    admin.firestore.mockReturnValue(mockFirestore);

    mockDb = {
      collection: vi.fn((name) => {
        switch (name) {
          case 'settings': return settingsCollection;
          case 'users': return usersCollection;
          case 'notifications': return notificationsCollection;
          case 'warning_logs': return warningLogsCollection;
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
    settingsCollection.toArray.mockResolvedValue([
      { institute: { enableAttendanceAutomation: true, lowAttendanceThreshold: 75 } }
    ]);

    usersCollection.toArray.mockResolvedValue([
      { firebaseUid: 'student-1', role: 'student', email: 's1@test.com' },
      { firebaseUid: 'student-2', role: 'student', email: 's2@test.com' }
    ]);

    warningLogsCollection.findOne.mockResolvedValue(null);

    // Student 1: 50% attendance (below 75%)
    mockAttendanceCollection.get
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ userId: 'student-1', status: 'present' }) },
          { data: () => ({ userId: 'student-1', status: 'absent' }) }
        ]
      })
      // Student 2: 100% attendance
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ userId: 'student-2', status: 'present' }) },
          { data: () => ({ userId: 'student-2', status: 'present' }) }
        ]
      });

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
    settingsCollection.toArray.mockResolvedValue([
      { institute: { enableAttendanceAutomation: true, lowAttendanceThreshold: 75 } }
    ]);

    usersCollection.toArray.mockResolvedValue([
      { firebaseUid: 'student-1', role: 'student', email: 's1@test.com' }
    ]);

    // Mock recent warning log exists
    warningLogsCollection.findOne.mockResolvedValue({ userId: 'student-1' });

    const res = await GET(mockRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.warningsIssued).toBe(0);
    expect(notificationsCollection.insertMany).not.toHaveBeenCalled();
  });

  it('should skip students without firebaseUid', async () => {
    settingsCollection.toArray.mockResolvedValue([
      { institute: { enableAttendanceAutomation: true, lowAttendanceThreshold: 75 } }
    ]);

    usersCollection.toArray.mockResolvedValue([
      { role: 'student', email: 's1@test.com' }
    ]);

    const res = await GET(mockRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.warningsIssued).toBe(0);
    expect(mockAttendanceCollection.get).not.toHaveBeenCalled();
  });
});
