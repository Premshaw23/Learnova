import { describe, it, expect, vi, beforeEach } from 'vitest';

// withErrorHandler is a pass-through so POST resolves to the inner async function
vi.mock('@/lib/error-handler', () => ({
  withErrorHandler: (fn) => fn,
  authenticateRequest: vi.fn(),
  parseJSON: vi.fn(),
}));

vi.mock('@/lib/api-response', () => ({
  jsonError: vi.fn((msg, status) => ({
    json: async () => ({ error: msg }),
    status,
  })),
  jsonSuccess: vi.fn((data, status) => ({
    json: async () => data,
    status,
  })),
}));

vi.mock('@/lib/firebase-admin', () => ({
  initFirebaseAdmin: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  FieldValue: { serverTimestamp: vi.fn(() => 'mock-timestamp') },
}));

vi.mock('@/lib/gamification-service', () => ({
  awardXp: vi.fn(),
}));

vi.mock('@/lib/dateUtils', () => ({
  getLocalDateKey: vi.fn(() => '2026-05-28'),
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock('@/lib/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

import { authenticateRequest, parseJSON } from '@/lib/error-handler';
import { getUserProfile } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rateLimit';
import { POST } from '@/app/api/attendance/record/route';

function makeRequest(overrides = {}) {
  return {
    headers: { get: vi.fn(() => '127.0.0.1') },
    ...overrides,
  };
}

function makeFirestoreDb({ docExists = false } = {}) {
  const mockTransaction = {
    get: vi.fn().mockResolvedValue({ exists: docExists }),
    set: vi.fn(),
  };
  return {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({})),
    })),
    runTransaction: vi.fn(async (fn) => fn(mockTransaction)),
  };
}

describe('Attendance Record API Route — POST /api/attendance/record', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  it('returns 403 when userId does not match authenticated uid', async () => {
    authenticateRequest.mockResolvedValue({ uid: 'user-abc' });
    parseJSON.mockResolvedValue({
      userId: 'user-xyz', // different user
      confidenceScore: 85,
      date: '2026-05-28',
    });

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty('error');
  });

  it('returns 400 when confidenceScore is below minimum threshold (60)', async () => {
    authenticateRequest.mockResolvedValue({ uid: 'user-abc' });
    parseJSON.mockResolvedValue({
      userId: 'user-abc',
      confidenceScore: 50,
      date: '2026-05-28',
    });

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('returns 400 when confidenceScore is missing (undefined)', async () => {
    authenticateRequest.mockResolvedValue({ uid: 'user-abc' });
    parseJSON.mockResolvedValue({
      userId: 'user-abc',
      confidenceScore: undefined,
      date: '2026-05-28',
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
  });

  it('returns 400 when confidenceScore is a non-numeric string', async () => {
    authenticateRequest.mockResolvedValue({ uid: 'user-abc' });
    parseJSON.mockResolvedValue({
      userId: 'user-abc',
      confidenceScore: 'high',
      date: '2026-05-28',
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
  });

  it('returns 400 when confidenceScore exceeds 100', async () => {
    authenticateRequest.mockResolvedValue({ uid: 'user-abc' });
    parseJSON.mockResolvedValue({
      userId: 'user-abc',
      confidenceScore: 110,
      date: '2026-05-28',
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
  });

  it('returns 200 with alreadyRecorded: true when doc already exists', async () => {
    authenticateRequest.mockResolvedValue({
      uid: 'user-abc',
      email: 'test@learnova.edu',
    });
    parseJSON.mockResolvedValue({
      userId: 'user-abc',
      confidenceScore: 85,
      date: '2026-05-28',
    });
    getUserProfile.mockResolvedValue({
      fullName: 'Test User',
      email: 'test@learnova.edu',
      instituteId: 'inst-1',
    });
    getFirestore.mockReturnValue(makeFirestoreDb({ docExists: true }));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.alreadyRecorded).toBe(true);
  });

  it('returns 201 with alreadyRecorded: false when attendance is newly recorded', async () => {
    authenticateRequest.mockResolvedValue({
      uid: 'user-abc',
      email: 'test@learnova.edu',
    });
    parseJSON.mockResolvedValue({
      userId: 'user-abc',
      confidenceScore: 85,
      date: '2026-05-28',
    });
    getUserProfile.mockResolvedValue({
      fullName: 'Test User',
      email: 'test@learnova.edu',
      instituteId: 'inst-1',
    });
    getFirestore.mockReturnValue(makeFirestoreDb({ docExists: false }));

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.alreadyRecorded).toBe(false);
  });

  it('only exports POST — no DELETE handler', async () => {
    const routeModule = await import('@/app/api/attendance/record/route');
    expect(typeof routeModule.POST).toBe('function');
    expect(routeModule.DELETE).toBeUndefined();
    expect(routeModule.PUT).toBeUndefined();
  });
});
