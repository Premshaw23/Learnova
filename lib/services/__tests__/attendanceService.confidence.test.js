import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceService } from "../attendanceService";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { connectDb } from "@/lib/mongodb";
import { awardXp } from "@/lib/gamification-service";
import { publishEvent } from "@/lib/ssePublisher";

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
  FieldValue: {
    serverTimestamp: vi.fn(() => "server-timestamp"),
  },
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/gamification-service", () => ({
  awardXp: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/ssePublisher", () => ({
  publishEvent: vi.fn().mockResolvedValue({}),
}));

describe("AttendanceService.recordAttendance — confidence normalization", () => {
  let docRef;
  let collectionRef;
  let transactionSet;
  let transactionGet;
  let mongoUpdateOne;

  beforeEach(() => {
    vi.clearAllMocks();

    getUserProfile.mockResolvedValue({
      fullName: "Test Student",
      email: "student@example.com",
      instituteId: "inst-1",
      role: "student",
    });

    docRef = {};
    collectionRef = { doc: vi.fn(() => docRef) };
    transactionGet = vi.fn().mockResolvedValue({ exists: false });
    transactionSet = vi.fn();

    getFirestore.mockReturnValue({
      runTransaction: vi.fn(async (callback) =>
        callback({ get: transactionGet, set: transactionSet })
      ),
      collection: vi.fn(() => collectionRef),
    });

    mongoUpdateOne = vi.fn().mockResolvedValue({});
    connectDb.mockResolvedValue({
      collection: vi.fn(() => ({ updateOne: mongoUpdateOne })),
    });

    publishEvent.mockReturnValue({ catch: vi.fn() });
  });

  it.each([
    { raw: 85, normalized: 0.85 },
    { raw: 60, normalized: 0.6 },
    { raw: 100, normalized: 1 },
  ])(
    "persists confidenceScore=$normalized (not double-divided) for raw=$raw, in both Firestore and MongoDB",
    async ({ raw, normalized }) => {
      // Mirrors what app/api/attendance/record/route.js now sends:
      // a single, already-normalized 0-1 value under `normalizedConfidenceScore`.
      const normalizedConfidenceScore = raw / 100;

      await AttendanceService.recordAttendance(
        {
          userId: "user-123",
          studentName: "Client Name",
          email: "client@example.com",
          normalizedConfidenceScore,
          normalizedDate: "2026-05-25",
        },
        { uid: "user-123", role: "student" }
      );

      expect(transactionSet).toHaveBeenCalledWith(
        docRef,
        expect.objectContaining({ confidenceScore: normalized }),
        { merge: true }
      );

      expect(mongoUpdateOne).toHaveBeenCalledWith(
        { userId: "user-123", date: "2026-05-25" },
        expect.objectContaining({
          $set: expect.objectContaining({ confidenceScore: normalized }),
        }),
        { upsert: true }
      );
    }
  );

  it("does not re-divide an already-normalized confidence score by 100", async () => {
    // Regression guard for the original bug: raw=85 -> route normalizes to 0.85
    // -> service must persist 0.85, never 0.0085.
    await AttendanceService.recordAttendance(
      {
        userId: "user-123",
        studentName: "Client Name",
        email: "client@example.com",
        normalizedConfidenceScore: 0.85,
        normalizedDate: "2026-05-25",
      },
      { uid: "user-123", role: "student" }
    );

    const [, firestorePayload] = transactionSet.mock.calls[0];
    expect(firestorePayload.confidenceScore).toBe(0.85);
    expect(firestorePayload.confidenceScore).not.toBeCloseTo(0.0085);
  });
});