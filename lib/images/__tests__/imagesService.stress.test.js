import {
  validateFaceDescriptor,
  updateUserImageInDb,
} from "@/lib/images/imagesService";
import { connectDb } from "@/lib/mongodb";

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

describe("Images Service Stress and Edge-Case Testing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Rapid Metadata Loop: Verify determinism over 100 repeated cycles", async () => {
    const updateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });
    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({ updateOne }),
    });

    const fakeDescriptor = Array(128).fill(0.12345);

    for (let i = 0; i < 100; i++) {
      // Toggle between providing descriptor and unsetting descriptor
      const provideMetadata = i % 2 === 0;

      await updateUserImageInDb({
        firebaseUid: `uid-${i}`,
        imageUrl: `https://public.blob.vercel-storage.com/image-${i}.jpg`,
        faceDescriptor: provideMetadata ? fakeDescriptor : null,
      });

      const lastCall = updateOne.mock.calls[updateOne.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({ firebaseUid: `uid-${i}` });

      if (provideMetadata) {
        expect(lastCall[1]).toEqual({
          $set: {
            image: `https://public.blob.vercel-storage.com/image-${i}.jpg`,
            faceDescriptor: fakeDescriptor,
          },
        });
      } else {
        expect(lastCall[1]).toEqual({
          $set: {
            image: `https://public.blob.vercel-storage.com/image-${i}.jpg`,
          },
          $unset: {
            faceDescriptor: "",
          },
        });
      }
    }

    expect(updateOne).toHaveBeenCalledTimes(100);
  });

  test("2. Malformed Payloads: Verify validation rejects bad inputs deterministically", () => {
    // Array with non-numbers
    const badArray = Array(128).fill("bad");
    expect(() => validateFaceDescriptor(JSON.stringify(badArray))).toThrow("Invalid face descriptor format");

    // Array with wrong length (127 elements)
    const wrongLengthArray = Array(127).fill(0.5);
    expect(() => validateFaceDescriptor(JSON.stringify(wrongLengthArray))).toThrow("Invalid face descriptor format");

    // Empty array
    expect(() => validateFaceDescriptor(JSON.stringify([]))).toThrow("Invalid face descriptor format");

    // Oversized payload (greater than 20000 characters)
    const oversizedString = "a".repeat(20001);
    expect(() => validateFaceDescriptor(oversizedString)).toThrow("Face descriptor payload too large");

    // Random non-JSON garbage string
    expect(() => validateFaceDescriptor("not-json-garbage")).toThrow("Invalid face descriptor format");

    // Non-string formats (numbers, objects, functions)
    expect(() => validateFaceDescriptor(12345)).toThrow("Invalid face descriptor format");
    expect(() => validateFaceDescriptor({ some: "object" })).toThrow("Invalid face descriptor format");
  });

  test("3. Concurrent Replayed Updates: Test consistency across parallel async calls", async () => {
    const updateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });
    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({ updateOne }),
    });

    const fakeDescriptor = Array(128).fill(0.999);

    // Dispatch 20 concurrent updates to the same user ID
    const promises = Array(20)
      .fill(null)
      .map((_, i) =>
        updateUserImageInDb({
          firebaseUid: "user-12345",
          imageUrl: `https://public.blob.vercel-storage.com/avatar-${i}.jpg`,
          faceDescriptor: i % 2 === 0 ? fakeDescriptor : null,
        })
      );

    await Promise.all(promises);

    expect(updateOne).toHaveBeenCalledTimes(20);
    // Verify each call strictly respects atomic MongoDB $set/$unset contract
    updateOne.mock.calls.forEach((call, index) => {
      expect(call[0]).toEqual({ firebaseUid: "user-12345" });
      if (index % 2 === 0) {
        expect(call[1]).toEqual({
          $set: {
            image: `https://public.blob.vercel-storage.com/avatar-${index}.jpg`,
            faceDescriptor: fakeDescriptor,
          },
        });
      } else {
        expect(call[1]).toEqual({
          $set: {
            image: `https://public.blob.vercel-storage.com/avatar-${index}.jpg`,
          },
          $unset: {
            faceDescriptor: "",
          },
        });
      }
    });
  });
});
