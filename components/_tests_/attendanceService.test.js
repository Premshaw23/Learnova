import { recordAttendance, hasCheckedInToday } from "@/services/attendanceService";
import { runTransaction, getDocs } from "firebase/firestore";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/firebaseConfig", () => ({
  db: { type: "firestore" },
}));

jest.mock("@/services/statsService", () => ({
  recalculateAttendanceRate: jest.fn().mockResolvedValue(0.9),
}));

jest.mock("@/lib/offlineStore", () => ({
  saveToOutbox: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/syncService", () => ({
  registerBackgroundSync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn().mockReturnValue({ id: "mock-doc-ref" }),
  getDocs: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn().mockReturnValue("mock-timestamp"),
  where: jest.fn(),
  limit: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeExistingDoc = () => ({ exists: () => true });
const makeNewDoc = () => ({ exists: () => false });

const mockTransactionSet = jest.fn();

const makeTransactionExecutor = (docSnapshot) => (db, callback) => {
  const transaction = {
    get: jest.fn().mockResolvedValue(docSnapshot),
    set: mockTransactionSet,
  };
  return callback(transaction);
};

const baseParams = {
  userId: "user-123",
  studentName: "Alice Smith",
  email: "alice@test.com",
  confidenceScore: 0.97,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("recordAttendance - atomic TOCTOU fix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
      writable: true,
    });
  });

  test("throws if userId is missing", async () => {
    await expect(recordAttendance({ ...baseParams, userId: null })).rejects.toThrow(
      "Attendance cannot be saved without a signed-in user."
    );
  });

  test("returns { alreadyRecorded: true } if record already exists in transaction", async () => {
    runTransaction.mockImplementation(makeTransactionExecutor(makeExistingDoc()));

    const result = await recordAttendance(baseParams);

    expect(result).toEqual({ alreadyRecorded: true });
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  test("inserts record and returns { alreadyRecorded: false, newRate } when no existing record", async () => {
    runTransaction.mockImplementation(makeTransactionExecutor(makeNewDoc()));

    const result = await recordAttendance(baseParams);

    expect(result).toEqual({ alreadyRecorded: false, newRate: 0.9 });
    expect(mockTransactionSet).toHaveBeenCalledWith(
      { id: "mock-doc-ref" },
      expect.objectContaining({
        userId: "user-123",
        studentName: "Alice Smith",
        email: "alice@test.com",
        confidenceScore: 0.97,
        status: "present",
        timestamp: "mock-timestamp",
      })
    );
  });

  test("uses runTransaction — never uses a separate pre-check query before writing", async () => {
    runTransaction.mockImplementation(makeTransactionExecutor(makeNewDoc()));

    await recordAttendance(baseParams);

    // The old pattern called getDocs for the pre-check; the new pattern must NOT
    expect(getDocs).not.toHaveBeenCalled();
    expect(runTransaction).toHaveBeenCalledTimes(1);
  });

  test("concurrent requests: only the first write commits, second sees existing doc", async () => {
    let firstCallCommitted = false;

    // Simulate concurrent execution: both calls start, first commits, second sees existing
    runTransaction.mockImplementation((db, callback) => {
      const docSnapshot = firstCallCommitted ? makeExistingDoc() : makeNewDoc();
      firstCallCommitted = true;

      const transaction = {
        get: jest.fn().mockResolvedValue(docSnapshot),
        set: mockTransactionSet,
      };
      return callback(transaction);
    });

    const [result1, result2] = await Promise.all([
      recordAttendance(baseParams),
      recordAttendance(baseParams),
    ]);

    // Only one write should have occurred
    expect(mockTransactionSet).toHaveBeenCalledTimes(1);

    // First call inserted, second detected duplicate
    expect(result1).toEqual({ alreadyRecorded: false, newRate: 0.9 });
    expect(result2).toEqual({ alreadyRecorded: true });
  });

  test("queues offline when navigator.onLine is false and returns queuedOffline flag", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
      writable: true,
    });

    const { saveToOutbox } = require("@/lib/offlineStore");
    const result = await recordAttendance(baseParams);

    expect(result).toEqual({ alreadyRecorded: false, newRate: null, queuedOffline: true });
    expect(saveToOutbox).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-123" })
    );
    expect(runTransaction).not.toHaveBeenCalled();
  });
});

describe("hasCheckedInToday", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns true when attendance record exists for today", async () => {
    getDocs.mockResolvedValue({ empty: false });

    const result = await hasCheckedInToday("user-123");

    expect(result).toBe(true);
  });

  test("returns false when no attendance record exists for today", async () => {
    getDocs.mockResolvedValue({ empty: true });

    const result = await hasCheckedInToday("user-123");

    expect(result).toBe(false);
  });

  test("returns false when userId is missing", async () => {
    const result = await hasCheckedInToday(null);
    expect(result).toBe(false);
    expect(getDocs).not.toHaveBeenCalled();
  });
});
