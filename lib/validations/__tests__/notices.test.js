import { describe, it, expect } from "vitest";
import { createNoticeSchema } from "../notices";

describe("createNoticeSchema validation", () => {
  it("should validate a correct notice payload", () => {
    const payload = {
      title: "Notice Title",
      content: "Notice Content",
      tags: ["tag1", "tag2"],
      targetAudience: ["students"],
    };
    const result = createNoticeSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject tags array exceeding 50 items", () => {
    const payload = {
      title: "Notice Title",
      content: "Notice Content",
      tags: Array(51).fill("tag"),
      targetAudience: ["students"],
    };
    const result = createNoticeSchema.safeParse(payload);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain("50");
  });

  it("should reject targetAudience array exceeding 50 items", () => {
    const payload = {
      title: "Notice Title",
      content: "Notice Content",
      tags: ["tag1"],
      targetAudience: Array(51).fill("audience"),
    };
    const result = createNoticeSchema.safeParse(payload);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain("50");
  });
});
