import {
  validateFaceDescriptor,
  updateUserImageInDb,
} from "@/lib/images/imagesService";
import { connectDb } from "@/lib/mongodb";

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

describe("Images Service Stress and Edge-Case Testing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("1. Rapid Metadata Loop: Verify determinism over 100 repeated cycles", async () => {
    const usersUpdateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });
    const faceDescUpdateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });
    const faceDescDeleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockImplementation((name) => {
        if (name === "face_descriptors") {
          return { updateOne: faceDescUpdateOne, deleteOne: faceDescDeleteOne };
        }
        return { updateOne: usersUpdateOne };
      }),
    });

    const fakeDescriptor = Array(128).fill(0.12345);

    for (let i = 0; i < 100; i++) {
      const provideMetadata = i % 2 === 0;

      await updateUserImageInDb({
        firebaseUid: `uid-${i}`,
        imageUrl: `https://public.blob.vercel-storage.com/image-${i}.jpg`,
        faceDescriptor: provideMetadata ? fakeDescriptor : null,
      });

      const userCall = usersUpdateOne.mock.calls[i];
      expect(userCall[0]).toEqual({ firebaseUid: `uid-${i}` });
      expect(userCall[1]).toEqual({
        $set: { image: `https://public.blob.vercel-storage.com/image-${i}.jpg` },
      });
    }

    expect(usersUpdateOne).toHaveBeenCalledTimes(100);
    expect(faceDescUpdateOne).toHaveBeenCalledTimes(50);
    expect(faceDescDeleteOne).toHaveBeenCalledTimes(50);
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
    const usersUpdateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });
    const faceDescUpdateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });
    const faceDescDeleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockImplementation((name) => {
        if (name === "face_descriptors") {
          return { updateOne: faceDescUpdateOne, deleteOne: faceDescDeleteOne };
        }
        return { updateOne: usersUpdateOne };
      }),
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

    expect(usersUpdateOne).toHaveBeenCalledTimes(20);
    expect(faceDescUpdateOne).toHaveBeenCalledTimes(10);
    expect(faceDescDeleteOne).toHaveBeenCalledTimes(10);

    // Verify each users call strictly respects atomic MongoDB $set contract
    usersUpdateOne.mock.calls.forEach((call, index) => {
      expect(call[0]).toEqual({ firebaseUid: "user-12345" });
      expect(call[1]).toEqual({
        $set: { image: `https://public.blob.vercel-storage.com/avatar-${index}.jpg` },
      });
    });
  });
});
