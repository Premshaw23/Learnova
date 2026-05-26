import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  extractImageFileFromFormData,
  getUserImageFromDb,
  updateUserImageInDb,
  uploadAvatarToBlob,
  validateImageRequestId,
  validateRemoteImageUrl,
} from "@/lib/images/imagesService";
import { connectDb } from "@/lib/mongodb";
import { put } from "@vercel/blob";

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

jest.mock("@vercel/blob", () => ({
  put: jest.fn(),
}));

describe("imagesService helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exports centralized image constants", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(ALLOWED_IMAGE_TYPES.has("image/jpeg")).toBe(true);
    expect(ALLOWED_IMAGE_TYPES.has("image/png")).toBe(true);
    expect(ALLOWED_IMAGE_TYPES.has("image/webp")).toBe(true);
  });

  test("validateImageRequestId rejects empty and malformed ids", () => {
    expect(() => validateImageRequestId("")).toThrow("Missing user id parameter");
    expect(() => validateImageRequestId("abc")).toThrow("Invalid user id");
  });

  test("validateRemoteImageUrl allows expected HTTPS hosts", () => {
    expect(() =>
      validateRemoteImageUrl("https://public.blob.vercel-storage.com/path/file.jpg")
    ).not.toThrow();

    expect(() =>
      validateRemoteImageUrl("https://lh3.googleusercontent.com/avatar")
    ).not.toThrow();
  });

  test("validateRemoteImageUrl rejects non-https and disallowed hosts", () => {
    expect(() => validateRemoteImageUrl("http://public.blob.vercel-storage.com/a.jpg")).toThrow(
      "Image URL must use HTTPS"
    );

    expect(() => validateRemoteImageUrl("https://evil.example.com/a.jpg")).toThrow(
      "Image source not allowed"
    );
  });

  test("extractImageFileFromFormData rejects missing file", () => {
    const formData = {
      get: jest.fn().mockReturnValue(null),
    };

    expect(() => extractImageFileFromFormData(formData)).toThrow(
      "File is required and must be a valid file"
    );
  });

  test("uploadAvatarToBlob validates and uploads file", async () => {
    const file = {
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    };

    put.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/avatars/u1.jpg",
    });

    const result = await uploadAvatarToBlob({
      file,
      uid: "u1",
    });

    expect(result.blobUrl).toContain("https://public.blob.vercel-storage.com/");
    expect(put).toHaveBeenCalled();
  });

  test("getUserImageFromDb reads user image by object id", async () => {
    const findOne = jest.fn().mockResolvedValue({
      image: "https://public.blob.vercel-storage.com/a.jpg",
    });

    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne,
      }),
    });

    const image = await getUserImageFromDb({
      id: "507f1f77bcf86cd799439011",
    });

    expect(image).toBe("https://public.blob.vercel-storage.com/a.jpg");
    expect(findOne).toHaveBeenCalled();
  });

  test("updateUserImageInDb updates image by firebase uid", async () => {
    const updateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });

    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        updateOne,
      }),
    });

    await updateUserImageInDb({
      firebaseUid: "firebase-uid-123",
      imageUrl: "https://public.blob.vercel-storage.com/new.jpg",
    });

    expect(updateOne).toHaveBeenCalledWith(
      { firebaseUid: "firebase-uid-123" },
      { $set: { image: "https://public.blob.vercel-storage.com/new.jpg" } }
    );
  });
});
