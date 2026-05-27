import { POST } from "./route";
import { authenticateRequest, parseJSON } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

jest.mock("@/lib/error-handler", () => ({
  authenticateRequest: jest.fn(),
  withErrorHandler: (handler) => handler,
  parseJSON: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

jest.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: jest.fn(),
  getUserProfile: jest.fn(),
}));

jest.mock("@/lib/gamification-service", () => ({
  awardXp: jest.fn().mockResolvedValue({ xpAwarded: 50, newLevel: null }),
}));

jest.mock("@/lib/dateUtils", () => ({
  getLocalDateKey: jest.fn(() => "2026-05-25"),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
  FieldValue: {
    serverTimestamp: jest.fn(() => "server-timestamp"),
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("attendance record route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("writes attendance to Firestore with canonical doc id + instituteId using transaction", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({
      userId: "user-123",
      studentName: "Client Name",
      email: "client@example.com",
      confidenceScore: 75,
      date: "2026-05-25",
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = {};
    const collectionRef = { doc: jest.fn(() => docRef) };
    const transactionSet = jest.fn();
    const transactionGet = jest.fn().mockResolvedValue({ exists: false });

    getFirestore.mockReturnValue({
      runTransaction: jest.fn(async (callback) => {
        return callback({ get: transactionGet, set: transactionSet });
      }),
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      headers: new Headers([["authorization", "Bearer test"]]),
      cookies: { get: jest.fn() },
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { alreadyRecorded: false },
    });

    expect(collectionRef.doc).toHaveBeenCalledWith("user-123_2026-05-25");
    expect(transactionGet).toHaveBeenCalledWith(docRef);
    expect(transactionSet).toHaveBeenCalledWith(
      docRef,
      expect.objectContaining({
        userId: "user-123",
        studentName: "Server Name",
        email: "server@example.com",
        instituteId: "inst-999",
        date: "2026-05-25",
        status: "present",
        confidenceScore: 0.75,
        offlineSynced: false,
        timestamp: FieldValue.serverTimestamp.mock.results[0].value,
      }),
      { merge: true },
    );
  });

  test("prevents duplicate check-in if document already exists", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({
      userId: "user-123",
      studentName: "Client Name",
      email: "client@example.com",
      confidenceScore: 80,
      date: "2026-05-25",
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = {};
    const collectionRef = { doc: jest.fn(() => docRef) };
    const transactionSet = jest.fn();
    const transactionGet = jest.fn().mockResolvedValue({ exists: true });

    getFirestore.mockReturnValue({
      runTransaction: jest.fn(async (callback) => {
        return callback({ get: transactionGet, set: transactionSet });
      }),
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      headers: new Headers([["authorization", "Bearer test"]]),
      cookies: { get: jest.fn() },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { alreadyRecorded: true },
    });

    expect(collectionRef.doc).toHaveBeenCalledWith("user-123_2026-05-25");
    expect(transactionGet).toHaveBeenCalledWith(docRef);
    expect(transactionSet).not.toHaveBeenCalled();
  });

  test("simulates concurrent double-click requests and guarantees single write via OCC retry simulation", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({
      userId: "user-123",
      studentName: "Client Name",
      email: "client@example.com",
      confidenceScore: 75,
      date: "2026-05-25",
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = "user-123_2026-05-25";
    const collectionRef = { doc: jest.fn(() => docRef) };

    const dbStore = new Map();
    const transactionSet = jest.fn();

    // High-fidelity OCC Simulation:
    // If two requests read concurrently, both see 'exists === false'.
    // One succeeds, writes to the dbStore.
    // The second transaction will detect that the store has been updated since its read phase,
    // abort, retry, read again, see 'exists === true', and return without writing.
    const runTransaction = jest.fn(async (callback) => {
      let attempts = 0;
      while (attempts < 5) {
        attempts++;
        // Interleave the operations with a small async tick
        await new Promise((resolve) => setTimeout(resolve, 5));

        const get = async (ref) => ({ exists: dbStore.has(ref) });

        let pendingWrite = null;
        const set = (ref, data) => {
          pendingWrite = { ref, data };
        };

        await callback({ get, set });

        if (pendingWrite) {
          if (dbStore.has(pendingWrite.ref)) {
            // Collision detected - retry callback!
            continue;
          }
          // Successful transaction commit
          dbStore.set(pendingWrite.ref, pendingWrite.data);
          transactionSet(pendingWrite.ref, pendingWrite.data);
        }
        break;
      }
    });

    getFirestore.mockReturnValue({
      runTransaction,
      collection: jest.fn(() => collectionRef),
    });

    // Execute double-click / rapid concurrent requests in parallel
    const [response1, response2] = await Promise.all([
      POST({
        headers: new Headers([["authorization", "Bearer test"]]),
        cookies: { get: jest.fn() },
      }),
      POST({
        headers: new Headers([["authorization", "Bearer test"]]),
        cookies: { get: jest.fn() },
      }),
    ]);

    // One of the concurrent requests must succeed and create (201), the other should return alreadyRecorded (200)
    const statusCodes = [response1.status, response2.status].sort();
    expect(statusCodes).toEqual([200, 201]);

    const resJson1 = await response1.json();
    const resJson2 = await response2.json();

    const results = [resJson1.data.alreadyRecorded, resJson2.data.alreadyRecorded].sort();
    expect(results).toEqual([false, true]);

    // Firestore must have exactly 1 record committed
    expect(dbStore.size).toBe(1);
    expect(dbStore.has(docRef)).toBe(true);
    expect(transactionSet).toHaveBeenCalledTimes(1);
  });
});
