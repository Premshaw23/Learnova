import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
}));

const { mockCollection, mockDoc, mockGet, mockUpdate, mockSet } = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockDoc = vi.fn().mockReturnValue({
    get: mockGet,
    update: mockUpdate,
    set: mockSet,
  });
  const mockCollection = vi.fn().mockReturnValue({
    doc: mockDoc,
  });
  return { mockCollection, mockDoc, mockGet, mockUpdate, mockSet };
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn().mockReturnValue({
    collection: mockCollection,
  }),
  FieldValue: {
    increment: vi.fn().mockImplementation((val) => val),
  },
}));

function createMockRequest(body) {
  return {
    headers: {
      get: vi.fn().mockReturnValue("application/json"),
    },
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe("POST /api/quiz/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });
  });

  it("should fail if activityId is missing", async () => {
    const req = createMockRequest({
      title: "Quantum Physics Quiz",
      selectedAnswers: {},
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("activityId is required");
  });

  it("should fail if activity does not exist", async () => {
    mockGet.mockResolvedValue({ exists: false });
    const req = createMockRequest({
      activityId: "act-123",
      title: "Quantum Physics Quiz",
      selectedAnswers: { 0: 2, 1: 1, 2: 2 },
    });

    const response = await POST(req);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Activity not found");
  });

  it("should grade quiz and return passed: true when correct answers match", async () => {
    mockGet.mockImplementation(async () => {
      // Simulate activity doc get
      return {
        exists: true,
        data: () => ({
          userId: "user-123",
          title: "Quantum Physics Quiz",
        }),
      };
    });

    const req = createMockRequest({
      activityId: "act-123",
      title: "Quantum Physics Quiz",
      selectedAnswers: { 0: 2, 1: 1, 2: 2 }, // Correct answers for Quantum Physics Quiz
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.passed).toBe(true);
    expect(data.data.percentage).toBe(100);
    expect(mockUpdate).toHaveBeenCalledWith({ progress: 100 });
  });

  it("should grade quiz and return passed: false when answers do not match minimum threshold", async () => {
    mockGet.mockImplementation(async () => {
      return {
        exists: true,
        data: () => ({
          userId: "user-123",
          title: "Quantum Physics Quiz",
        }),
      };
    });

    const req = createMockRequest({
      activityId: "act-123",
      title: "Quantum Physics Quiz",
      selectedAnswers: { 0: 0, 1: 0, 2: 0 },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.passed).toBe(false);
    expect(data.data.percentage).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
