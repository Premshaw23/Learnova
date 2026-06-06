import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from "@/app/api/attendance/exceptions/update/route";
import { getFirestore } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/rbac";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
      };
    }),
  },
}));

describe("POST /api/attendance/exceptions/update", () => {
  let mockUpdate;
  let mockDoc;
  let mockCollection;

  const extractError = (body) => {
    if (!body) return "";
    if (typeof body === "string") return body;
    if (typeof body.error === "string") return body.error;
    if (body.error?.message) return body.error.message;
    if (body.message) return body.message;
    return JSON.stringify(body);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdate = vi.fn().mockResolvedValue({});
    mockDoc = vi.fn(() => ({
      update: mockUpdate,
    }));
    mockCollection = vi.fn(() => ({
      doc: mockDoc,
    }));

    getFirestore.mockReturnValue({
      collection: mockCollection,
    });
  });

  const createMockRequest = (bodyData, uid = "admin-uid") => {
    requireAuth.mockResolvedValue({ uid, role: "admin" });
    return {
      json: vi.fn().mockResolvedValue(bodyData),
    };
  };

  test("successfully updates exception status when authorized", async () => {
    const req = createMockRequest({
      exceptionId: "exc-123",
      status: "approved",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      status: "approved",
      updatedAt: expect.any(String),
      updatedBy: "admin-uid",
    });
  });

  test("rejects invalid status types with 400 Bad Request", async () => {
    const req = createMockRequest({
      exceptionId: "exc-123",
      status: "completely-invalid-status",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(extractError(body).toLowerCase()).toContain("status");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("rejects request missing exceptionId with 400 Bad Request", async () => {
    const req = createMockRequest({
      status: "approved",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(extractError(body).toLowerCase()).toContain("missing");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("rejects non-admin users with 403 Forbidden", async () => {
    requireAuth.mockResolvedValue({ uid: "student-uid", role: "student" });
    const req = {
      json: vi.fn().mockResolvedValue({ exceptionId: "exc-123", status: "approved" }),
    };

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(extractError(body).toLowerCase()).toContain("forbidden");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
