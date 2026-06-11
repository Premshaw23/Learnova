import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
  parseJSON: vi.fn(async (req) => await req.json()),
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/errors", () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

vi.mock("@/lib/firebase-admin", () => ({
  initializeFirebase: vi.fn(),
}));

vi.mock("firebase-admin", () => {
  const mockSet = vi.fn().mockResolvedValue({});
  const mockDelete = vi.fn().mockResolvedValue({});
  const mockGet = vi.fn().mockResolvedValue({ exists: false });
  const mockSetCustomUserClaims = vi.fn().mockResolvedValue({});

  const firestoreFn = vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: mockGet,
        set: mockSet,
        delete: mockDelete,
      })),
    })),
  }));

  const authFn = vi.fn(() => ({
    setCustomUserClaims: mockSetCustomUserClaims,
  }));

  return {
    default: {
      firestore: firestoreFn,
      auth: authFn,
    },
    firestore: firestoreFn,
    auth: authFn,
  };
});

vi.mock("@/lib/mongodb", () => {
  const mockUsersUpdateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });
  const mockUsersDeleteOne = vi.fn().mockResolvedValue({});
  const mockCollection = vi.fn((name) => {
    if (name === "users") {
      return {
        updateOne: mockUsersUpdateOne,
        deleteOne: mockUsersDeleteOne,
      };
    }
    return {
      updateOne: vi.fn().mockResolvedValue({}),
      deleteOne: vi.fn().mockResolvedValue({}),
      insertOne: vi.fn().mockResolvedValue({}),
    };
  });

  const mockMongoDb = {
    collection: mockCollection,
  };

  return {
    connectDb: vi.fn().mockResolvedValue(mockMongoDb),
  };
});

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { POST } from "../route";
import { requireAuth } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import admin from "firebase-admin";

describe("POST /api/auth/set-role", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await connectDb();
    const usersCol = db.collection("users");
    usersCol.updateOne.mockResolvedValue({ matchedCount: 1 });
    admin
      .firestore()
      .collection()
      .doc()
      .get.mockResolvedValue({ exists: false });
  });

  const createMockRequest = (body) => {
    return {
      json: async () => body,
      headers: {
        get: () => "127.0.0.1",
      },
    };
  };

  test("rejects setting teacher role without invalid/missing invite code", async () => {
    requireAuth.mockResolvedValue({
      uid: "user-123",
      email: "test@example.com",
    });
    process.env.TEACHER_INVITE_CODE = "SECRET_123";

    const request = createMockRequest({
      role: "teacher",
      fullName: "Teacher Test",
      inviteCode: "WRONG",
    });

    const response = await POST(request, {
      role: "teacher",
      fullName: "Teacher Test",
      inviteCode: "WRONG",
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain("Invalid or missing teacher invite code");
  });

  test("successfully sets role and writes to firestore, claims, and mongodb", async () => {
    requireAuth.mockResolvedValue({
      uid: "user-123",
      email: "student@example.com",
    });

    const request = createMockRequest({
      role: "student",
      fullName: "Student Test",
    });

    const response = await POST(request, {
      role: "student",
      fullName: "Student Test",
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(admin.auth().setCustomUserClaims).toHaveBeenCalledWith("user-123", {
      role: "student",
    });
    expect(admin.firestore().collection().doc().set).toHaveBeenCalled();
    const db = await connectDb();
    expect(db.collection("users").updateOne).toHaveBeenCalled();
  });

  test("retries mongo sync and triggers rollback on complete failure", async () => {
    requireAuth.mockResolvedValue({
      uid: "user-failed",
      email: "student@example.com",
    });

    // Mock MongoDB updateOne failure
    const db = await connectDb();
    db.collection("users").updateOne.mockRejectedValue(
      new Error("Mongo network error")
    );

    const request = createMockRequest({
      role: "student",
      fullName: "Student Failed",
    });

    const response = await POST(request, {
      role: "student",
      fullName: "Student Failed",
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("rolled back");

    // Mongo update should have been called 3 times (initial + 2 retries)
    expect(db.collection("users").updateOne).toHaveBeenCalledTimes(3);

    // Compensating actions (claims rollback and firestore delete) must be called
    expect(admin.auth().setCustomUserClaims).toHaveBeenLastCalledWith(
      "user-failed",
      {}
    );
    expect(admin.firestore().collection().doc().delete).toHaveBeenCalled();
  });
});
