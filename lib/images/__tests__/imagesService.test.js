import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  extractImageFileFromFormData,
  getUserImageFromDb,
  updateUserImageInDb,
  uploadAvatarToBlob,
  validateImageRequestId,
  validateRemoteImageUrl,
  validateFaceDescriptor,
} from "@/lib/images/imagesService";
import { connectDb } from "@/lib/mongodb";
import { put } from "@vercel/blob";

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

describe("imagesService helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("exports centralized image constants", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(ALLOWED_IMAGE_TYPES.has("image/jpeg")).toBe(true);
    expect(ALLOWED_IMAGE_TYPES.has("image/png")).toBe(true);
    expect(ALLOWED_IMAGE_TYPES.has("image/webp")).toBe(true);
  });

  test("validateImageRequestId rejects empty and malformed ids", () => {
    expect(() => validateImageRequestId("")).toThrow(
      "Missing user id parameter"
    );
    expect(() => validateImageRequestId("abc")).toThrow("Invalid user id");
  });

  test("validateRemoteImageUrl allows expected HTTPS hosts", () => {
    expect(() =>
      validateRemoteImageUrl(
        "https://public.blob.vercel-storage.com/path/file.jpg"
      )
    ).not.toThrow();

    expect(() =>
      validateRemoteImageUrl("https://lh3.googleusercontent.com/avatar")
    ).not.toThrow();
  });

  test("validateRemoteImageUrl rejects non-https and disallowed hosts", () => {
    expect(() =>
      validateRemoteImageUrl("http://public.blob.vercel-storage.com/a.jpg")
    ).toThrow("Image URL must use HTTPS");

    expect(() =>
      validateRemoteImageUrl("https://evil.example.com/a.jpg")
    ).toThrow("Image source not allowed");
  });

  test("extractImageFileFromFormData rejects missing file", () => {
    const formData = {
      get: vi.fn().mockReturnValue(null),
    };

    expect(() => extractImageFileFromFormData(formData)).toThrow(
      "File is required and must be a valid file"
    );
  });

  test("uploadAvatarToBlob validates and uploads file", async () => {
    const file = {
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
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
    const findOne = vi.fn().mockResolvedValue({
      image: "https://public.blob.vercel-storage.com/a.jpg",
    });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne,
      }),
    });

    const image = await getUserImageFromDb({
      id: "507f1f77bcf86cd799439011",
    });

    expect(image).toBe("https://public.blob.vercel-storage.com/a.jpg");
    expect(findOne).toHaveBeenCalled();
  });

  test("updateUserImageInDb updates image and unsets faceDescriptor by default", async () => {
    const updateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        updateOne,
      }),
    });

    await updateUserImageInDb({
      firebaseUid: "firebase-uid-123",
      imageUrl: "https://public.blob.vercel-storage.com/new.jpg",
    });

    expect(updateOne).toHaveBeenCalledWith(
      { firebaseUid: "firebase-uid-123" },
      {
        $set: { image: "https://public.blob.vercel-storage.com/new.jpg" },
        $unset: { faceDescriptor: "" },
      }
    );
  });

  test("updateUserImageInDb updates image and sets faceDescriptor when provided", async () => {
    const updateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        updateOne,
      }),
    });

    const fakeDescriptor = Array(128).fill(0.1);
    await updateUserImageInDb({
      firebaseUid: "firebase-uid-123",
      imageUrl: "https://public.blob.vercel-storage.com/new.jpg",
      faceDescriptor: fakeDescriptor,
    });

    expect(updateOne).toHaveBeenCalledWith(
      { firebaseUid: "firebase-uid-123" },
      {
        $set: {
          image: "https://public.blob.vercel-storage.com/new.jpg",
          faceDescriptor: fakeDescriptor,
        },
      }
    );
  });

  test("updateUserImageInDb throws when no Mongo profile matches firebase uid", async () => {
    const updateOne = vi.fn().mockResolvedValue({ matchedCount: 0 });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        updateOne,
      }),
    });

    await expect(
      updateUserImageInDb({
        firebaseUid: "missing-user",
        imageUrl: "https://public.blob.vercel-storage.com/new.jpg",
      })
    ).rejects.toThrow("User profile not found");
  });

  test("validateFaceDescriptor validates correct length and formats", () => {
    expect(validateFaceDescriptor(null)).toBeNull();
    expect(validateFaceDescriptor(undefined)).toBeNull();

    const validArray = Array(128).fill(0.5);
    const validJson = JSON.stringify(validArray);
    expect(validateFaceDescriptor(validJson)).toEqual(validArray);

    // Invalid non-string inputs
    expect(() => validateFaceDescriptor(123)).toThrow(
      "Invalid face descriptor format"
    );

    // Payload too large
    const longString = "A".repeat(25000);
    expect(() => validateFaceDescriptor(longString)).toThrow(
      "Face descriptor payload too large"
    );

    // Invalid array length (e.g. 10 instead of 128)
    const shortArray = Array(10).fill(0.5);
    expect(() => validateFaceDescriptor(JSON.stringify(shortArray))).toThrow(
      "Invalid face descriptor format"
    );

    // Non-numeric elements
    const badArray = Array(128).fill("not-a-number");
    expect(() => validateFaceDescriptor(JSON.stringify(badArray))).toThrow(
      "Invalid face descriptor format"
    );
  });
});
