import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile, getUserProfileByEmail } from "@/lib/firebase-admin";

vi.mock("mongodb", () => ({
  ObjectId: class {
    constructor(id) {
      this.id = id;
    }
    toString() {
      return this.id;
    }
    static isValid(id) {
      return typeof id === "string" && id.length === 24;
    }
  }
}));

import { PUT } from "@/app/api/exceptions/update/route";
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
        headers: new Map(),
      };
    }),
  },
}));

vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
  getUserProfile: vi.fn(),
  getUserProfileByEmail: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

describe("PUT /api/exceptions/update - Security and Validation Tests", () => {
  let mockUpdateOne;
  let mockFindOne;
  let consoleLogMock;
  let originalConsoleLog;

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateOne = vi.fn();
    mockFindOne = vi.fn();
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: mockFindOne,
        updateOne: mockUpdateOne,
      }),
    });

    originalConsoleLog = console.log;
    consoleLogMock = vi.fn();
    console.log = consoleLogMock;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  const createMockRequest = (headers, bodyData) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: vi.fn().mockResolvedValue(bodyData),
      text: vi.fn().mockResolvedValue(JSON.stringify(bodyData)),
    };
  };

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: false, reason: "No token" });

    const req = createMockRequest({}, { exceptionId: "507f1f77bcf86cd799439011", status: "approved" });
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects request if user profile not found with 403", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue(null);

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("User profile not found. Access denied.");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects standard student role with 403 Forbidden", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "student@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "student" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden: Requires one of admin, teacher");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects missing exceptionId with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Web Development"] });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("exceptionId is required");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects malformed ObjectId with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Web Development"] });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "invalid-object-id", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid exception ID");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects invalid status (e.g. pending or custom string) with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Web Development"] });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "pending" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid status value");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects teacher modification if they teach a different class and don't share student subjects (IDOR protection)", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "teacher-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Data Structures"] });
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      studentEmail: "student@domain.com",
      className: "Web Development",
    });
    getUserProfileByEmail.mockResolvedValue({
      email: "student@domain.com",
      subjects: ["Web Development", "Database Systems"],
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Forbidden: You are not authorized");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("accepts teacher modification if teacher teaches the class of the exception", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "teacher-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Web Development"] });
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      studentEmail: "student@domain.com",
      className: "Web Development",
    });
    mockUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved", comments: "Authorized" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Exception updated successfully");
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  test("accepts teacher modification as fallback if teacher shares a subject with the student", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "teacher-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Database Systems"] });
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      studentEmail: "student@domain.com",
      className: "Web Development",
    });
    getUserProfileByEmail.mockResolvedValue({
      email: "student@domain.com",
      subjects: ["Web Development", "Database Systems"],
    });
    mockUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Exception updated successfully");
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  test("accepts admin modification unconditionally and logs audit entry with approver UID", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "admin-123", email: "admin@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "admin" });
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      studentEmail: "student@domain.com",
      className: "Web Development",
    });
    mockUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "rejected" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Exception updated successfully");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({
          approverId: "admin-123",
          reviewedBy: "admin@domain.com",
        }),
      })
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("[Audit Log] Exception 507f1f77bcf86cd799439011 rejected by approver UID: admin-123")
    );
  });

  test("accepts valid request with empty or null comments", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "admin-123", email: "admin@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "admin" });
    mockFindOne.mockResolvedValue({ _id: "507f1f77bcf86cd799439011", studentEmail: "student@domain.com" });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved", comments: "" }
    );
    const response = await PUT(req);

    expect(response.status).toBe(200);
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  test("rejects request if status is entirely missing", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "admin-123", email: "admin@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "admin" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid status value");
  });

  test("returns 404 if matching exception record not found", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Web Development"] });
    mockFindOne.mockResolvedValue(null);

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "rejected" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Exception not found");
  });

  test("handles database query exceptions gracefully returning 500", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Web Development"] });
    mockFindOne.mockRejectedValue(new Error("Database disconnected"));

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
