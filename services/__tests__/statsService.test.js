import {
  getWeekdaysSince,
  initializeUserStats,
  updateUserStat,
  recalculateAttendanceRate,
} from "../statsService";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getCountFromServer,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

jest.mock("@/lib/firebaseConfig", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getCountFromServer: jest.fn(),
  increment: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

describe("statsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWeekdaysSince", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("should calculate correct number of weekdays for a given start date", () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-01-10T12:00:00Z"));
      const weekdays = getWeekdaysSince(new Date("2024-01-01T12:00:00Z"));
      expect(weekdays).toBe(8);
    });

    it("should default to start of year if no start date is provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-01-10T12:00:00Z"));
      const weekdays = getWeekdaysSince();
      expect(weekdays).toBe(8);
    });

    it("should return at least 1 even if checked exactly on Jan 1st of a weekend", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T12:00:00Z"));
      const weekdays = getWeekdaysSince();
      expect(weekdays).toBe(1);
    });
  });

  describe("initializeUserStats", () => {
    it("should do nothing if userId is falsy", async () => {
      await initializeUserStats(null);
      expect(doc).not.toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it("should set default stats for a valid user", async () => {
      const userId = "user123";
      const mockDocRef = {};
      doc.mockReturnValue(mockDocRef);

      await initializeUserStats(userId);

      expect(doc).toHaveBeenCalledWith(db, "userStats", userId);
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          "Courses Enrolled": 0,
          "Attendance Rate": "0%",
          "Assignments Done": 0,
          "Study Hours": 0,
        })
      );
      const setDocCall = setDoc.mock.calls[0][1];
      expect(setDocCall.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe("updateUserStat", () => {
    it("should do nothing if userId is falsy", async () => {
      await updateUserStat(null, "Courses Enrolled");
      expect(doc).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("should initialize user stats if they do not exist and update the stat", async () => {
      const userId = "user123";
      const mockDocRef = {};
      doc.mockReturnValue(mockDocRef);
      getDoc.mockResolvedValue({ exists: () => false });
      increment.mockReturnValue("mockIncrement");

      await updateUserStat(userId, "Study Hours", 2);

      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          "Study Hours": "mockIncrement",
        })
      );
    });

    it("should just update the stat if user stats exist", async () => {
      const userId = "user123";
      const mockDocRef = {};
      doc.mockReturnValue(mockDocRef);
      getDoc.mockResolvedValue({ exists: () => true });
      increment.mockReturnValue("mockIncrement");

      await updateUserStat(userId, "Courses Enrolled");

      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(setDoc).not.toHaveBeenCalled(); 
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          "Courses Enrolled": "mockIncrement",
        })
      );
    });
  });

  describe("recalculateAttendanceRate", () => {
    it("should return early if no userId", async () => {
      const result = await recalculateAttendanceRate(null);
      expect(result).toBeUndefined();
    });

    it("should calculate and update attendance rate correctly", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-01-10T12:00:00Z"));

      const userId = "user123";
      const mockStatsDocRef = { id: "userStatsRef" };
      const mockUserDocRef = { id: "userDocRef" };

      doc.mockImplementation((db, collectionName, id) => {
        if (collectionName === "userStats") return mockStatsDocRef;
        if (collectionName === "users") return mockUserDocRef;
        return {};
      });

      // Stats exist, User doc exists
      getDoc.mockImplementation(async (docRef) => {
        if (docRef === mockStatsDocRef) return { exists: () => true };
        if (docRef === mockUserDocRef) return { exists: () => true, data: () => ({ createdAt: new Date("2024-01-01T12:00:00Z") }) };
      });

      getCountFromServer.mockResolvedValue({ data: () => ({ count: 4 }) });

      const rate = await recalculateAttendanceRate(userId);

      expect(getCountFromServer).toHaveBeenCalled();
      expect(rate).toBe(50); // 4 days out of 8 weekdays -> 50%
      expect(updateDoc).toHaveBeenCalledWith(
        mockStatsDocRef,
        expect.objectContaining({
          "Attendance Rate": "50%",
          attendancePresentDays: 4,
        })
      );

      jest.useRealTimers();
    });

    it("should limit attendance rate to 100% max", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-01-10T12:00:00Z"));

      doc.mockImplementation(() => ({}));
      getDoc.mockImplementation(async () => {
        return { exists: () => true, data: () => ({ createdAt: new Date("2024-01-01T12:00:00Z") }) };
      });

      // 10 present days but only 8 weekdays
      getCountFromServer.mockResolvedValue({ data: () => ({ count: 10 }) });

      const rate = await recalculateAttendanceRate("user123");
      expect(rate).toBe(100);

      jest.useRealTimers();
    });

    it("should throw error if getCountFromServer fails", async () => {
      doc.mockReturnValue({});
      getDoc.mockResolvedValue({ exists: () => true });
      getCountFromServer.mockRejectedValue(new Error("Query failed"));

      await expect(recalculateAttendanceRate("user123")).rejects.toThrow("Query failed");
    });
  });
});
