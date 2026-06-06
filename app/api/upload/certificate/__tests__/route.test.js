import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { requireRole } from "@/lib/rbac";
import { processAndUploadCertificate } from "@/lib/services/uploadService";
import { ValidationError } from "@/lib/errors";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    })),
  },
}));

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => async (req) => {
    try {
      return await handler(req);
    } catch (error) {
      return {
        status: error.statusCode || 500,
        json: async () => ({ error: error.message }),
      };
    }
  },
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/services/uploadService", () => ({
  processAndUploadCertificate: vi.fn(),
}));

describe("POST /api/upload/certificate", () => {
  const createRequest = (file) => ({
    headers: { get: vi.fn(() => "127.0.0.1") },
    formData: vi.fn().mockResolvedValue({
      get: (key) => (key === "file" ? file : null),
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
    });
  });

  it("rejects invalid file types", async () => {
    const file = {
      name: "test.exe",
      type: "application/octet-stream",
      size: 100,
    };
    processAndUploadCertificate.mockRejectedValue(
      new ValidationError("Invalid file type. Only PDF, PNG, and JPG are allowed.")
    );

    const response = await POST(createRequest(file));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid file type");
  });

  it("uploads valid certificate", async () => {
    const file = {
      name: "cert.pdf",
      type: "application/pdf",
      size: 1024,
    };
    processAndUploadCertificate.mockResolvedValue({
      url: "https://blob.vercel-storage.com/cert.pdf",
      mimeType: "application/pdf",
    });

    const response = await POST(createRequest(file));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toContain("cert.pdf");
    expect(processAndUploadCertificate).toHaveBeenCalledWith(
      file,
      "certificates/teacher-1"
    );
  });
});
