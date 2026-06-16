import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
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
  ValidationError: class ValidationError extends Error {},
  ForbiddenError: class ForbiddenError extends Error {},
}));

vi.mock("@/lib/transactionCoordinator", () => ({
  executeSaga: vi.fn(),
  findExistingOperation: vi.fn().mockResolvedValue(null),
  markIdempotent: vi.fn(),
}));

vi.mock("@/lib/images/imagesService", () => ({
  validateFaceDescriptor: vi.fn((input) => {
    if (!input || typeof input !== "string") {
      throw new Error("Invalid face descriptor format");
    }
    return input;
  }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initializeFirebase: vi.fn(),
}));

vi.mock("firebase-admin", () => ({
  default: {
    firestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ exists: false }),
          set: vi.fn().mockResolvedValue({}),
          delete: vi.fn().mockResolvedValue({}),
        })),
      })),
    })),
  },
  firestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ exists: false }),
        set: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      })),
    })),
  })),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn().mockResolvedValue({
    collection: vi.fn(() => ({
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mongo-id" }),
      deleteOne: vi.fn().mockResolvedValue({}),
      createIndex: vi.fn().mockResolvedValue({}),
    })),
  }),
}));

vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({ url: "https://blob.example/image.jpg" }),
  del: vi.fn().mockResolvedValue({}),
}));

import { POST } from "../route";
import { requireAuth } from "@/lib/rbac";
import { executeSaga } from "@/lib/transactionCoordinator";

const createFormData = () => {
  const file = {
    type: "image/jpeg",
    size: 1024,
    arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff]).buffer,
  };
  return {
    get: (key) => {
      if (key === "name") return "Test User";
      if (key === "rollNo") return "ROLL-123";
      if (key === "email") return "test@example.com";
      if (key === "photo") return file;
      if (key === "faceDescriptor") return "valid-descriptor";
      return null;
    },
  };
};

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("includes Firestore profile write in the registration saga", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123", email: "test@example.com" });

    executeSaga.mockResolvedValue({ success: true, context: { _insertedUser: { _id: "mongo-id", name: "Test User", rollNo: "ROLL-123", email: "test@example.com" } } });

    const request = {
      formData: async () => createFormData(),
      headers: {
        get: () => "127.0.0.1",
      },
    };

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(executeSaga).toHaveBeenCalled();
    const sagaArgs = executeSaga.mock.calls[0][0];
    expect(sagaArgs.steps.some((step) => step.name === "write_firestore_profile")).toBe(true);
    expect(result.user.email).toBe("test@example.com");
  });
});
