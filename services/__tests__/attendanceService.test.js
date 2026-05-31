import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordAttendance } from "../attendanceService";
import { auth, db } from "@/lib/firebaseConfig";
import { getDoc } from "firebase/firestore";
import { recalculateAttendanceRate } from "../statsService";

vi.mock("@/lib/firebaseConfig", () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(),
    },
  },
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => "attendance-doc-ref"),
  getDoc: vi.fn(),
}));

vi.mock("../statsService", () => ({
  recalculateAttendanceRate: vi.fn(),
}));

vi.mock("@/lib/offlineStore", () => ({
  saveToOutbox: vi.fn(),
}));

vi.mock("@/lib/syncService", () => ({
  registerBackgroundSync: vi.fn(),
}));

vi.mock("@/lib/dateUtils", () => ({
  getTodayKeyLocal: vi.fn(() => "2026-05-30"),
}));

describe("recordAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    auth.currentUser.getIdToken.mockResolvedValue("token-123");
    getDoc.mockResolvedValue({ exists: () => false });
    recalculateAttendanceRate.mockResolvedValue(95);
    global.fetch = vi.fn();
  });

  it("unwraps standardized API success envelopes", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { alreadyRecorded: true },
      }),
    });

    const result = await recordAttendance({
      userId: "user-123",
      studentName: "Asha",
      email: "asha@example.com",
      confidenceScore: 84,
    });

    expect(result).toEqual({
      alreadyRecorded: true,
      newRate: null,
    });
    expect(recalculateAttendanceRate).not.toHaveBeenCalled();
  });

  it("uses nested API error messages from standardized error envelopes", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: {
          code: "HTTP_400",
          message: "Bad Request: Invalid or spoofed confidence score",
        },
      }),
    });

    await expect(
      recordAttendance({
        userId: "user-123",
        studentName: "Asha",
        email: "asha@example.com",
        confidenceScore: 10,
      })
    ).rejects.toThrow("Bad Request: Invalid or spoofed confidence score");
  });
});
