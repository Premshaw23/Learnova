import { POST } from "./route";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  extractImageFileFromFormData,
  updateUserImageInDb,
} from "@/lib/images/imagesService";
import {
  processAndUploadFile,
  activeStorage,
} from "@/lib/services/uploadService";
import { ValidationError } from "@/lib/errors";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    })),
  },
}));

vi.mock("@/lib/services/uploadService", () => ({
  processAndUploadFile: vi.fn(),
  activeStorage: { delete: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/images/imagesService", () => ({
  extractImageFileFromFormData: vi.fn(),
  updateUserImageInDb: vi.fn(),
}));

describe("POST /api/upload/avatar", () => {
  const createRequest = () => ({
    headers: {
      get: vi.fn(() => "127.0.0.1"),
    },
    formData: vi.fn().mockResolvedValue(new FormData()),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });
    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  it("uploads an avatar and stores the blob URL", async () => {
    const file = {
      name: "avatar.jpg",
      type: "image/jpeg",
      size: 1024,
    };

    extractImageFileFromFormData.mockReturnValue(file);
    processAndUploadFile.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/avatar.jpg",
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toBe(
      "https://public.blob.vercel-storage.com/avatar.jpg"
    );
    expect(processAndUploadFile).toHaveBeenCalledWith(file, "avatars/user-123");
    expect(updateUserImageInDb).toHaveBeenCalledWith({
      firebaseUid: "user-123",
      imageUrl: "https://public.blob.vercel-storage.com/avatar.jpg",
      faceDescriptor: null,
    });
  });

  it("returns validation errors as 400 responses", async () => {
    extractImageFileFromFormData.mockImplementation(() => {
      throw new ValidationError("Invalid image type");
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid image type");
    expect(processAndUploadFile).not.toHaveBeenCalled();
  });

  it("deletes an uploaded blob if the database update fails", async () => {
    const file = {
      name: "avatar.jpg",
      type: "image/jpeg",
      size: 1024,
    };

    extractImageFileFromFormData.mockReturnValue(file);
    processAndUploadFile.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/avatar.jpg",
    });
    updateUserImageInDb.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    expect(activeStorage.delete).toHaveBeenCalledWith(
      "https://public.blob.vercel-storage.com/avatar.jpg"
    );
  });
});
