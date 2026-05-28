import { GET, POST } from "@/app/api/images/route";
import { requireAuth } from "@/lib/rbac";
import {
  extractImageFileFromFormData,
  fetchAndValidateImage,
  getUserImageFromDb,
  updateUserImageInDb,
  uploadAvatarToBlob,
} from "@/lib/images/imagesService";

jest.mock("next/server", () => {
  class MockNextResponse {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    async json() {
      return JSON.parse(this.body);
    }
  }
  MockNextResponse.json = jest.fn().mockImplementation((body, init) => {
    return {
      status: init?.status || 200,
      json: async () => body,
      headers: new Map(),
    };
  });
  return {
    NextResponse: MockNextResponse,
  };
});

jest.mock("@/lib/rbac", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/images/imagesService", () => ({
  extractImageFileFromFormData: jest.fn(),
  fetchAndValidateImage: jest.fn(),
  getImageResponseHeaders: jest.fn().mockReturnValue({
    "Content-Type": "image/jpeg",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  }),
  getUserImageFromDb: jest.fn(),
  updateUserImageInDb: jest.fn(),
  uploadAvatarToBlob: jest.fn(),
  validateFaceDescriptor: jest.fn(),
}));

describe("/api/images route orchestration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET orchestrates auth, DB image lookup, and remote fetch", async () => {
    requireAuth.mockResolvedValue({ uid: "u1" });
    getUserImageFromDb.mockResolvedValue("https://public.blob.vercel-storage.com/a.jpg");
    fetchAndValidateImage.mockResolvedValue({
      imageBuffer: new ArrayBuffer(3),
      contentType: "image/jpeg",
    });

    const req = {
      url: "https://learnova.test/api/images?id=507f1f77bcf86cd799439011",
      headers: { get: jest.fn() },
    };

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(requireAuth).toHaveBeenCalledWith(req);
    expect(getUserImageFromDb).toHaveBeenCalledWith({
      id: "507f1f77bcf86cd799439011",
    });
    expect(fetchAndValidateImage).toHaveBeenCalledWith(
      "https://public.blob.vercel-storage.com/a.jpg"
    );
  });

  test("POST orchestrates auth, file extraction, upload and DB update", async () => {
    const fakeFile = {
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    };

    requireAuth.mockResolvedValue({ uid: "firebase-uid-1" });
    extractImageFileFromFormData.mockReturnValue(fakeFile);
    uploadAvatarToBlob.mockResolvedValue({
      blobUrl: "https://public.blob.vercel-storage.com/avatar.jpg",
    });

    const req = {
      headers: { get: jest.fn() },
      formData: jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue(fakeFile),
      }),
    };

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.url).toBe("https://public.blob.vercel-storage.com/avatar.jpg");

    expect(requireAuth).toHaveBeenCalledWith(req);
    expect(extractImageFileFromFormData).toHaveBeenCalled();
    expect(uploadAvatarToBlob).toHaveBeenCalledWith({
      file: fakeFile,
      uid: "firebase-uid-1",
    });
    expect(updateUserImageInDb).toHaveBeenCalledWith({
      firebaseUid: "firebase-uid-1",
      imageUrl: "https://public.blob.vercel-storage.com/avatar.jpg",
    });
  });
});
