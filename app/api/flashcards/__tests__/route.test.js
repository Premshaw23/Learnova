import { POST } from "@/app/api/flashcards/route";
import { requireRole } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import * as FlashcardModel from "@/lib/models/flashcardModel";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/models/flashcardModel", () => ({
  createFlashcard: vi.fn(),
}));

const createMockRequest = (headers, body) => ({
  headers: {
    get: (name) => headers[name.toLowerCase()] || null,
  },
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

describe("POST /api/flashcards - Zod Validation and Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ payload: { uid: "user-123", role: "student" } });
    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  it("should create a flashcard successfully with valid tags", async () => {
    const mockCard = { id: "card-123" };
    FlashcardModel.createFlashcard.mockResolvedValue(mockCard);

    const req = createMockRequest({}, {
      front: "Front content",
      back: "Back content",
      tags: ["tag1", "tag2"],
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.flashcard).toEqual(mockCard);
  });

  it("should fail validation if tags exceed 50 items", async () => {
    const req = createMockRequest({}, {
      front: "Front content",
      back: "Back content",
      tags: Array(51).fill("tag"),
    });

    const res = await POST(req);
    expect(res.status).toBe(500); // generic Error mapped to 500 in withErrorHandler
  });
});
