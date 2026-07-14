import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/attendance/override/route";

// Mock withErrorHandler as a pass-through
vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
  parseJSON: vi.fn(),
}));

vi.mock("@/lib/api-response", () => ({
  jsonError: vi.fn((msg, status) => ({
    json: async () => ({ error: msg }),
    status,
  })),
  jsonSuccess: vi.fn((data, status) => ({
    json: async () => data,
    status,
  })),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
  FieldValue: { serverTimestamp: vi.fn(() => "mock-timestamp") },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));

// Mock MongoDB
const mockUpdateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });
vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(async () => ({
    collection: vi.fn(() => ({
      updateOne: mockUpdateOne,
    })),
  })),
}));

// Mock requireAuth
vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

import { parseJSON } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/rbac";

function makeRequest(overrides = {}) {
  return {
    headers: { get: vi.fn(() => "127.0.0.1") },
    ...overrides,
  };
}

function makeFirestoreDb({ docExists = false } = {}) {
  const mockTransaction = {
    get: vi.fn().mockResolvedValue({ exists: docExists }),
    update: vi.fn(),
    set: vi.fn(),
  };
  return {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({})),
    })),
    runTransaction: vi.fn(async (fn) => fn(mockTransaction)),
    mockTransaction, // expose to verify calls
  };
}

describe("Attendance Override API Route — POST /api/attendance/override", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 403 when user is not a teacher or admin", async () => {
    requireAuth.mockResolvedValue({
      uid: "student-123",
      role: "student",
    });

    await expect(POST(makeRequest())).rejects.toThrow("Forbidden");
  });

  it("successfully overrides attendance and syncs to MongoDB with $setOnInsert", async () => {
    requireAuth.mockResolvedValue({
      uid: "teacher-123",
      role: "teacher",
    });
    parseJSON.mockResolvedValue({
      studentId: "student-456",
      date: "2026-07-04",
      status: "present",
    });
    getUserProfile.mockResolvedValue({
      fullName: "Jane Doe",
      email: "jane@learnova.edu",
      instituteId: "inst-99",
    });

    const mockFsDb = makeFirestoreDb({ docExists: true });
    getFirestore.mockReturnValue(mockFsDb);

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBeUndefined(); // mock jsonSuccess does not wrap status if not explicit, but resolves data
    expect(data.updated).toBe(true);

    // Verify Firestore transaction ran update
    expect(mockFsDb.runTransaction).toHaveBeenCalled();
    expect(mockFsDb.mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
      status: "present",
      overriddenBy: "teacher-123",
      overriddenAt: "mock-timestamp",
    });

    // Verify MongoDB update was triggered with correct parameters
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { userId: "student-456", date: "2026-07-04" },
      {
        $set: {
          status: "present",
          overriddenBy: "teacher-123",
          overriddenAt: expect.any(Date),
          timestamp: expect.any(Date),
          offlineSynced: false,
        },
        $setOnInsert: {
          userId: "student-456",
          date: "2026-07-04",
          studentName: "Jane Doe",
          email: "jane@learnova.edu",
          instituteId: "inst-99",
        },
      },
      { upsert: true }
    );
  });
});
