import { GET } from '@/app/api/cron/attendance-warnings/route';
import { connectDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/mongodb', () => ({
  connectDb: vi.fn(),
}));

describe('Cron Job: Attendance Warnings', () => {
  let mockDb;
  let settingsCollection;
  let usersCollection;
  let attendanceCollection;
  let notificationsCollection;
  let warningLogsCollection;

  beforeEach(() => {
    settingsCollection = {
      find: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    };
    usersCollection = {
      find: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    };
    attendanceCollection = {
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

    mockDb = {
      collection: vi.fn((name) => {
        switch (name) {
          case 'settings': return settingsCollection;
          case 'users': return usersCollection;
          case 'attendance': return attendanceCollection;
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
      { uid: 'student-1', role: 'student', email: 's1@test.com' },
      { uid: 'student-2', role: 'student', email: 's2@test.com' }
    ]);

    warningLogsCollection.findOne.mockResolvedValue(null);

    // Student 1: 50% attendance (below 75%)
    // Student 2: 100% attendance
    attendanceCollection.toArray
      .mockResolvedValueOnce([
        { userId: 'student-1', status: 'present' },
        { userId: 'student-1', status: 'absent' }
      ])
      .mockResolvedValueOnce([
        { userId: 'student-2', status: 'present' },
        { userId: 'student-2', status: 'present' }
      ]);

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
      { uid: 'student-1', role: 'student', email: 's1@test.com' }
    ]);

    // Mock recent warning log exists
    warningLogsCollection.findOne.mockResolvedValue({ userId: 'student-1' });

    const res = await GET(mockRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.warningsIssued).toBe(0);
    expect(notificationsCollection.insertMany).not.toHaveBeenCalled();
  });
});
