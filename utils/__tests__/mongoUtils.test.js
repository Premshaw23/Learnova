import { escapeRegex, sanitizeSortField } from "../mongoUtils";

describe("MongoDB Safety Utilities - ReDoS & Injection Prevention", () => {
  describe("escapeRegex", () => {
    test("escapes standard regex metacharacters correctly", () => {
      const input = ".*+?^${}()|[]\\";
      const expected = "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\";
      expect(escapeRegex(input)).toBe(expected);
    });

    test("escapes a catastrophic backtracking pattern to literal string", () => {
      const maliciousInput = "^((a+)+)+$";
      const expected = "\\^\\(\\(a\\+\\)\\+\\)\\+\\$";
      expect(escapeRegex(maliciousInput)).toBe(expected);
    });

    test("escapes additional special characters like dash, slash, hash, space and comma", () => {
      const input = "- / # , ";
      const expected = "\\-\\ \\/\\ \\#\\ \\,\\ ";
      expect(escapeRegex(input)).toBe(expected);
    });

    test("truncates strings exceeding the default max length (100)", () => {
      const longInput = "a".repeat(150);
      const output = escapeRegex(longInput);
      expect(output).toHaveLength(100);
    });

    test("truncates strings exceeding custom max length limit", () => {
      const input = "abcdefgh";
      const output = escapeRegex(input, 4);
      expect(output).toBe("abcd");
    });

    test("returns empty string if input is non-string", () => {
      expect(escapeRegex(null)).toBe("");
      expect(escapeRegex(undefined)).toBe("");
      expect(escapeRegex(123)).toBe("");
      expect(escapeRegex({})).toBe("");
    });
  });

  describe("sanitizeSortField", () => {
    const allowed = new Set(["createdAt", "status", "studentEmail"]);

    test("allows fields in the allowlist", () => {
      expect(sanitizeSortField("createdAt", allowed)).toBe("createdAt");
      expect(sanitizeSortField("status", allowed)).toBe("status");
    });

    test("falls back to defaultField when input field is not in the allowlist", () => {
      expect(sanitizeSortField("maliciousField", allowed, "createdAt")).toBe(
        "createdAt"
      );
      expect(sanitizeSortField("password", allowed, "createdAt")).toBe(
        "createdAt"
      );
    });

    test("falls back to defaultField if input field is not a string", () => {
      expect(sanitizeSortField(null, allowed, "createdAt")).toBe("createdAt");
      expect(sanitizeSortField(123, allowed, "createdAt")).toBe("createdAt");
    });
  });
});
