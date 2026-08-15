import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { awardXp } from "@/lib/gamification-service";

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/gamification-service", () => ({
  awardXp: vi.fn(),
}));

function createMockRequest(body) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: { get: vi.fn().mockReturnValue("127.0.0.1") },
  };
}

describe("POST /api/productivity/session — idempotent focus-session retries", () => {
  let findOne;
  let insertOne;
  let db;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });
    checkRateLimit.mockResolvedValue({ allowed: true });
    awardXp.mockResolvedValue({ xpAwarded: 15 });

    findOne = vi.fn().mockResolvedValue(null);
    insertOne = vi.fn().mockResolvedValue({ insertedId: "session-1" });

    db = {
      collection: vi.fn((name) => {
        if (name === "pomodoro_sessions") {
          return { findOne, insertOne };
        }
        throw new Error(`Unexpected collection: ${name}`);
      }),
    };

    connectDb.mockResolvedValue(db);
  });

  it("passes clientRequestId as awardXp's referenceId and inserts one session on the first call", async () => {
    const req = createMockRequest({
      duration: 25,
      type: "focus",
      clientRequestId: "req-abc",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.xpAwarded).toBe(15);
    expect(insertOne).toHaveBeenCalledTimes(1);
    expect(awardXp).toHaveBeenCalledWith(
      "user-123",
      "focus_session_completed",
      { referenceId: "req-abc" }
    );
  });

  it("does not insert a duplicate session or re-award XP when the same clientRequestId is replayed", async () => {
    findOne.mockResolvedValue({
      firebaseUid: "user-123",
      duration: 25,
      type: "focus",
      completedAt: "2026-01-01T00:00:00.000Z",
      clientRequestId: "req-abc",
    });

    const req = createMockRequest({
      duration: 25,
      type: "focus",
      clientRequestId: "req-abc",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.xpAwarded).toBe(0);
    expect(body.reason).toBe("already_recorded");
    expect(insertOne).not.toHaveBeenCalled();
    expect(awardXp).not.toHaveBeenCalled();
  });
});