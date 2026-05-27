import { calculateReadingTime } from "../utils";

describe("calculateReadingTime utility function", () => {
  test("should handle null content gracefully", () => {
    expect(calculateReadingTime(null)).toBe("< 1 min read");
  });

  test("should handle undefined content gracefully", () => {
    expect(calculateReadingTime(undefined)).toBe("< 1 min read");
  });

  test("should handle empty content gracefully", () => {
    expect(calculateReadingTime("")).toBe("< 1 min read");
    expect(calculateReadingTime("   ")).toBe("< 1 min read");
  });

  test("should handle content with fewer than 200 words gracefully", () => {
    const text = "Hello world this is a test lesson content.";
    expect(calculateReadingTime(text)).toBe("1 min read");
  });

  test("should handle content with exactly 200 words", () => {
    const text = Array(200).fill("word").join(" ");
    expect(calculateReadingTime(text)).toBe("1 min read");
  });

  test("should handle content with 201 words (rounds up to 2 min)", () => {
    const text = Array(201).fill("word").join(" ");
    expect(calculateReadingTime(text)).toBe("2 min read");
  });

  test("should handle content with 400 words", () => {
    const text = Array(400).fill("word").join(" ");
    expect(calculateReadingTime(text)).toBe("2 min read");
  });

  test("should handle non-string inputs gracefully", () => {
    expect(calculateReadingTime(12345)).toBe("< 1 min read");
    expect(calculateReadingTime({})).toBe("< 1 min read");
    expect(calculateReadingTime([])).toBe("< 1 min read");
  });
});
