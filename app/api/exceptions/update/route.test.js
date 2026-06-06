import { PUT } from "./route";
import { parseJSON } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { getUserProfileByEmail } from "@/lib/firebase-admin";
import { ObjectId } from "mongodb";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Role-Based Access Control
vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

// Mock API Rate Limiter
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

// Mock Firebase Admin Services
vi.mock("@/lib/firebase-admin", () => ({
  getUserProfileByEmail: vi.fn(),
}));

// =========================================================================
// FIXED: Extracted shared mock instances to root for predictable cross-scope evaluation
// =========================================================================
const mockSharedCollection = {
  findOne: vi.fn(),
  updateOne: vi.fn(),
};
const mockSharedDb = {
  collection: vi.fn(() => mockSharedCollection),
};

vi.mock("@/lib/mongodb", () => {
  return {
    connectDb: vi.fn(() => Promise.resolve(mockSharedDb)),
  };
});

// Mock Error Handler with decoupled mock definitions to bypass hoisting crashes
vi.mock("@/lib/error-handler", () => {
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          const statusCode = error.statusCode || error.status || 500;
          const payload = error.originalMessage !== undefined ? error.originalMessage : error.message;
          return {
            status: statusCode,
            json: async () => ({ error: payload || "Internal server error" }),
          };
        }
      };
    },
    parseJSON: vi.fn(),
  };
});

// Mock Next.js Server primitives
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("exceptions update route", () => {
  let originalConsoleLog;
  let consoleLogMock;

  const validObjectId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 }),

    originalConsoleLog = console.log;
    consoleLogMock = vi.fn();
    console.log = consoleLogMock;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  const createMockRequest = (headers = {}) => {
    const headersMap = new Map(Object.entries({ "x-forwarded-for": "127.0.0.1", ...headers }));
    return {
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  test("allows admin to successfully update any exception request status", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "admin-123", email: "admin@example.com" },
      profile: { role: "admin" },
    });

    parseJSON.mockResolvedValue({
      exceptionId: validObjectId,
      status: "approved",
      comments: "Take care",
    });

    mockSharedCollection.findOne.mockResolvedValue({
      _id: new ObjectId(validObjectId),
      studentEmail: "student@example.com",
      class: "CS101",
    });

    mockSharedCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

    const response = await PUT(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body).toEqual({ message: "Exception updated successfully" });

    expect(mockSharedCollection.updateOne).toHaveBeenCalledWith(
      { _id: new ObjectId(validObjectId) },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "approved",
          reviewedBy: "admin@example.com",
          approverId: "admin-123",
          comments: "Take care",
        }),
      })
    );
  });

  test("allows teacher to successfully update status when there is a subject overlap", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-123", email: "teacher@example.com" },
      profile: { role: "teacher", subjects: ["CS101"] },
    });

    parseJSON.mockResolvedValue({
      exceptionId: validObjectId,
      status: "rejected",
    });

    mockSharedCollection.findOne.mockResolvedValue({
      _id: new ObjectId(validObjectId),
      studentEmail: "student@example.com",
      class: "CS101",
    });

    mockSharedCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

    const response = await PUT(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body).toEqual({ message: "Exception updated successfully" });
  });

  test("rejects request from teacher with 403 Forbidden if there is no class/subject overlap", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-123", email: "teacher@example.com" },
      profile: { role: "teacher", subjects: ["MATH101"] },
    });

    parseJSON.mockResolvedValue({
      exceptionId: validObjectId,
      status: "approved",
    });

    mockSharedCollection.findOne.mockResolvedValue({
      _id: new ObjectId(validObjectId),
      studentEmail: "student@example.com",
      class: "CS101",
    });

    getUserProfileByEmail.mockResolvedValue({
      subjects: ["CS101"],
    });

    const response = await PUT(createMockRequest());

    await assertApiError(
      response,
      403,
      "Forbidden: You are not authorized to update exception requests for this class/student."
    );
  });

  test("rejects request with 400 Validation Error on invalid inputs", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "admin-123", email: "admin@example.com" },
      profile: { role: "admin" },
    });

    parseJSON.mockResolvedValue({
      exceptionId: "invalid-id",
      status: "approved",
    });

    let response = await PUT(createMockRequest());
    await assertApiError(response, 400, "Invalid exception ID");

    parseJSON.mockResolvedValue({
      exceptionId: validObjectId,
      status: "pending",
    });

    response = await PUT(createMockRequest());
    await assertApiError(response, 400, "Invalid status value");
  });

  test("rejects request with 404 NotFound if exception document does not exist", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "admin-123", email: "admin@example.com" },
      profile: { role: "admin" },
    });

    parseJSON.mockResolvedValue({
      exceptionId: validObjectId,
      status: "approved",
    });

    mockSharedCollection.findOne.mockResolvedValue(null);

    const response = await PUT(createMockRequest());

    await assertApiError(response, 404, "Exception not found");
  });

  test("rejects request with 401 Unauthorized if token is missing or invalid", async () => {
    const mockUnauthError = new Error("Unauthorized");
    mockUnauthError.statusCode = 401;
    requireRole.mockRejectedValue(mockUnauthError);

    const response = await PUT(createMockRequest());
    await assertApiError(response, 401, "Unauthorized");
  });

  test("rejects request with 403 Forbidden if role is not allowed", async () => {
    const mockForbiddenError = new Error("Forbidden: Requires admin or teacher");
    mockForbiddenError.statusCode = 403;
    requireRole.mockRejectedValue(mockForbiddenError);

    const response = await PUT(createMockRequest());
    await assertApiError(response, 403, "Forbidden: Requires admin or teacher");
  });

  test("rejects request with 429 if rate limit is exceeded", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "admin-123", email: "admin@example.com" },
      profile: { role: "admin" },
    });
    checkRateLimit.mockResolvedValue({ allowed: false });

    const response = await PUT(createMockRequest());
    await assertApiError(response, 429, "Too many attempts. Please try again later.");
  });
});