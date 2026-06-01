import { ObjectId } from "mongodb";
import { GET, POST } from "@/app/api/images/route";
import { requireAuth } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/firebase-admin";
import { NotFoundError } from "@/lib/errors";
import {
  extractImageFileFromFormData,
  fetchAndValidateImage,
  getUserImageFromDb,
  updateUserImageInDb,
  uploadAvatarToBlob,
  validateFaceDescriptor,
} from "@/lib/images/imagesService";
import { del } from "@vercel/blob";

vi.mock("next/server", () => {
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
  MockNextResponse.json = vi.fn().mockImplementation((body, init) => {
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

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getUserProfile: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
}));

vi.mock("@/lib/images/imagesService", () => ({
  extractImageFileFromFormData: vi.fn(),
  fetchAndValidateImage: vi.fn(),
  getImageResponseHeaders: vi.fn().mockReturnValue({
    "Content-Type": "image/jpeg",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  }),
  getUserImageFromDb: vi.fn(),
  updateUserImageInDb: vi.fn(),
  uploadAvatarToBlob: vi.fn(),
  validateFaceDescriptor: vi.fn(),
}));

describe("/api/images route orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateFaceDescriptor.mockReturnValue(null);
  });

  test("GET returns own image when requested id matches authenticated user", async () => {
    const uid = "firebase-uid-1";
    const userId = new ObjectId();

    requireAuth.mockResolvedValue({ uid });
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue({ _id: userId }),
      }),
    });
    getUserImageFromDb.mockResolvedValue("https://public.blob.vercel-storage.com/a.jpg");
    fetchAndValidateImage.mockResolvedValue({
      imageBuffer: new ArrayBuffer(3),
      contentType: "image/jpeg",
    });

    const req = {
      url: `https://learnova.test/api/images?id=${userId.toString()}`,
      headers: { get: vi.fn() },
    };

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(requireAuth).toHaveBeenCalledWith(req);
    expect(getUserImageFromDb).toHaveBeenCalledWith({
      id: userId.toString(),
    });
    expect(fetchAndValidateImage).toHaveBeenCalledWith(
      "https://public.blob.vercel-storage.com/a.jpg"
    );
  });

  test("GET rejects when user requests another user's image and is not admin or teacher", async () => {
    const uid = "firebase-uid-1";
    const ownId = new ObjectId();
    const otherId = new ObjectId();

    requireAuth.mockResolvedValue({ uid });
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue({ _id: ownId }),
      }),
    });
    getUserProfile.mockResolvedValue({ role: "student" });

    const req = {
      url: `https://learnova.test/api/images?id=${otherId.toString()}`,
      headers: { get: vi.fn() },
    };

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You can only view your own profile image");
  });

  test("GET allows admin to view any user's image", async () => {
    const uid = "admin-uid-1";
    const ownId = new ObjectId();
    const otherId = new ObjectId();

    requireAuth.mockResolvedValue({ uid });
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue({ _id: ownId }),
      }),
    });
    getUserProfile.mockResolvedValue({ role: "admin" });
    getUserImageFromDb.mockResolvedValue("https://public.blob.vercel-storage.com/admin-view.jpg");
    fetchAndValidateImage.mockResolvedValue({
      imageBuffer: new ArrayBuffer(3),
      contentType: "image/jpeg",
    });

    const req = {
      url: `https://learnova.test/api/images?id=${otherId.toString()}`,
      headers: { get: vi.fn() },
    };

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(getUserImageFromDb).toHaveBeenCalledWith({
      id: otherId.toString(),
    });
  });

  test("GET allows teacher to view any user's image", async () => {
    const uid = "teacher-uid-1";
    const ownId = new ObjectId();
    const otherId = new ObjectId();

    requireAuth.mockResolvedValue({ uid });
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue({ _id: ownId, instituteId: "test-institute" }),
      }),
    });
    getUserProfile.mockResolvedValue({ role: "teacher" });
    getUserImageFromDb.mockResolvedValue("https://public.blob.vercel-storage.com/teacher-view.jpg");
    fetchAndValidateImage.mockResolvedValue({
      imageBuffer: new ArrayBuffer(3),
      contentType: "image/jpeg",
    });

    const req = {
      url: `https://learnova.test/api/images?id=${otherId.toString()}`,
      headers: { get: vi.fn() },
    };

    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  test("GET returns 404 if authenticated user has no MongoDB record", async () => {
    const uid = "orphan-uid";

    requireAuth.mockResolvedValue({ uid });
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue(null),
      }),
    });

    const req = {
      url: "https://learnova.test/api/images?id=507f1f77bcf86cd799439011",
      headers: { get: vi.fn() },
    };

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("User not found");
  });

  test("POST orchestrates auth, file extraction, upload and DB update", async () => {
    const fakeFile = {
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    };

    requireAuth.mockResolvedValue({ uid: "firebase-uid-1" });
    extractImageFileFromFormData.mockReturnValue(fakeFile);
    uploadAvatarToBlob.mockResolvedValue({
      blobUrl: "https://public.blob.vercel-storage.com/avatar.jpg",
    });

    const req = {
      headers: { get: vi.fn() },
      formData: vi.fn().mockResolvedValue({
        get: vi.fn((key) => {
          if (key === "faceDescriptor") return null;
          return fakeFile;
        }),
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
      faceDescriptor: null,
    });
  });

  test("POST rolls back uploaded blob when Mongo profile is missing", async () => {
    const fakeFile = {
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    };

    requireAuth.mockResolvedValue({ uid: "firebase-uid-1" });
    extractImageFileFromFormData.mockReturnValue(fakeFile);
    uploadAvatarToBlob.mockResolvedValue({
      blobUrl: "https://public.blob.vercel-storage.com/avatar.jpg",
    });
    updateUserImageInDb.mockRejectedValue(new NotFoundError("User profile not found"));

    const req = {
      headers: { get: vi.fn() },
      formData: vi.fn().mockResolvedValue({
        get: vi.fn((key) => {
          if (key === "faceDescriptor") return null;
          return fakeFile;
        }),
      }),
    };

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("User profile not found");
    expect(del).toHaveBeenCalledWith("https://public.blob.vercel-storage.com/avatar.jpg");
  });
});
