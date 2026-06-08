import { encryptProgressData, decryptProgressData } from "@/lib/progress-encryption";

describe("Progress Encryption/Decryption Utility Checks", () => {
  beforeAll(() => {
    process.env.LEARNING_DATA_ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
  });
  test("successfully encrypts and decrypts student progress data", () => {
    const originalData = {
      quizId: "quiz-123",
      answers: { "q-1": "choice-a", "q-2": "choice-c" },
      currentQuestionIndex: 2,
      timeRemaining: 180,
    };
    
    const encrypted = encryptProgressData(originalData);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
    
    const decrypted = decryptProgressData(encrypted);
    expect(decrypted).toBeDefined();
    expect(decrypted).toEqual(originalData);
  });
});
