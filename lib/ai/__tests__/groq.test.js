import {
  validateGroqBody,
  buildGroqRequest,
  extractGroqContent,
} from "@/lib/ai/groq";

describe("lib/ai/groq helpers", () => {
  test("validateGroqBody returns trimmed message from message field", () => {
    const result = validateGroqBody({ message: "  hello nova  " });

    expect(result).toEqual({ trimmedMessage: "hello nova", messages: [] });
  });

  test("validateGroqBody supports userMessage fallback", () => {
    const result = validateGroqBody({ userMessage: "  from fallback field " });

    expect(result).toEqual({ trimmedMessage: "from fallback field", messages: [] });
  });

  test("validateGroqBody throws for empty message", () => {
    expect(() => validateGroqBody({ message: "   " })).toThrow("Message is required");
  });

  test("validateGroqBody throws for over-length message", () => {
    expect(() => validateGroqBody({ message: "a".repeat(2001) })).toThrow(
      "Message too long (max 2000 characters)"
    );
  });

  test("buildGroqRequest returns expected payload shape", () => {
    const payload = buildGroqRequest("what is my attendance trend?");

    expect(payload.model).toBe("llama-3.1-8b-instant");
    expect(payload.max_tokens).toBe(400);
    expect(payload.temperature).toBe(0.7);
    expect(payload.messages[1]).toEqual({
      role: "user",
      content: "what is my attendance trend?",
    });
  });

  test("extractGroqContent returns null for empty or missing content", () => {
    expect(extractGroqContent(null)).toBeNull();
    expect(extractGroqContent({ choices: [{ message: { content: "   " } }] })).toBeNull();
  });

  test("extractGroqContent returns valid string content", () => {
    expect(
      extractGroqContent({
        choices: [{ message: { content: "Nova response" } }],
      })
    ).toBe("Nova response");
  });
});
