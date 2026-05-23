import { PUT } from "@/app/api/exceptions/update/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile, getUserProfileByEmail } from "@/lib/firebase-admin";
class ObjectId {
  constructor(id) {
    this.id = id;
  }
  toString() {
    return this.id;
  }
}
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
        headers: new Map(),
      };
    }),
  },
}));

jest.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: jest.fn(),
  getUserProfile: jest.fn(),
  getUserProfileByEmail: jest.fn(),
}));

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

describe("PUT /api/exceptions/update - Security and Validation Tests", () => {
  let mockUpdateOne;
  let mockFindOne;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpdateOne = jest.fn();
    mockFindOne = jest.fn();
    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
        updateOne: mockUpdateOne,
      }),
    });
  });

  const createMockRequest = (headers, bodyData) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: jest.fn().mockResolvedValue(bodyData),
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

  test("rejects request if user profile not found with 404", async () => {
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
      _id: new ObjectId("507f1f77bcf86cd799439011"),
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
      _id: new ObjectId("507f1f77bcf86cd799439011"),
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
      _id: new ObjectId("507f1f77bcf86cd799439011"),
      studentEmail: "student@domain.com",
      className: "Web Development",
    });
    getUserProfileByEmail.mockResolvedValue({
      email: "student@domain.com",
      subjects: ["Web Development", "Database Systems"], // Shares Database Systems!
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

  test("accepts admin modification unconditionally", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "admin-123", email: "admin@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "admin" });
    mockFindOne.mockResolvedValue({
      _id: new ObjectId("507f1f77bcf86cd799439011"),
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
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  test("returns 404 if matching exception record not found", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: true, decodedToken: { uid: "user-123", email: "teacher@domain.com" } });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Web Development"] });
    mockFindOne.mockResolvedValue(null); // Not found in DB!

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
