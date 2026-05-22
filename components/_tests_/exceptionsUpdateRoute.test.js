import { PUT } from "@/app/api/exceptions/update/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";

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
}));

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

jest.mock("mongodb", () => {
  return {
    ObjectId: Object.assign(
      jest.fn().mockImplementation((id) => {
        if (id === "invalid-object-id") {
          throw new Error("Invalid ObjectId");
        }
        return {
          toString: () => id,
        };
      }),
      {
        isValid: jest.fn().mockImplementation((id) => {
          return id !== "invalid-object-id";
        }),
      }
    ),
  };
});

describe("PUT /api/exceptions/update - Security and Validation Tests", () => {
  let mockUpdateOne;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpdateOne = jest.fn();
    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
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
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({}, { exceptionId: "507f1f77bcf86cd799439011", status: "approved" });
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects request if user profile not found with 404", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "teacher@domain.com" });
    getUserProfile.mockResolvedValue(null);

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("User profile not found");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects standard student role with 403 Forbidden", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "student@domain.com" });
    getUserProfile.mockResolvedValue({ role: "student" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects missing exceptionId with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "teacher@domain.com" });
    getUserProfile.mockResolvedValue({ role: "teacher" });

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
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "teacher@domain.com" });
    getUserProfile.mockResolvedValue({ role: "teacher" });

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
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "teacher@domain.com" });
    getUserProfile.mockResolvedValue({ role: "teacher" });

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

  test("accepts valid request and updates status to approved (200)", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "teacher@domain.com" });
    getUserProfile.mockResolvedValue({ role: "teacher" });
    mockUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { exceptionId: "507f1f77bcf86cd799439011", status: "approved  ", comments: "Valid excuse" }
    );
    const response = await PUT(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Exception updated successfully");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: expect.any(Object) },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "approved",
          comments: "Valid excuse",
          reviewedBy: "teacher@domain.com",
          reviewedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      })
    );
  });

  test("returns 404 if matching exception record not found", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "teacher@domain.com" });
    getUserProfile.mockResolvedValue({ role: "teacher" });
    mockUpdateOne.mockResolvedValue({ matchedCount: 0 });

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
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "teacher@domain.com" });
    getUserProfile.mockResolvedValue({ role: "teacher" });
    mockUpdateOne.mockRejectedValue(new Error("Database disconnected"));

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
