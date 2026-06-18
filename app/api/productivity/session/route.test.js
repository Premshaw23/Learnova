import { describe, test, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { connectDb } from "@/lib/mongodb";
import { requireRole, requireAuth } from "@/lib/rbac";
import { awardXp } from "@/lib/gamification-service";

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
  parseJSON: vi.fn((request) => request.json()),
}));

vi.mock("@/lib/gamification-service", () => ({
  awardXp: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("POST /api/productivity/session", () => {
  let mockDb;
  let mockCollection;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: "session-123" }),
      find: vi.fn(),
    };

    mockDb = {
      collection: vi.fn(() => mockCollection),
    };

    connectDb.mockResolvedValue(mockDb);
    requireRole.mockResolvedValue({ payload: { uid: "user-123" } });
    requireAuth.mockResolvedValue({ uid: "user-123" });
  });

  test("successfully records a focus session and awards XP", async () => {
    awardXp.mockResolvedValue({ xpAwarded: 15 });

    const request = {
      json: async () => ({
        duration: 25,
        completedAt: new Date().toISOString(),
        type: "focus",
      }),
      headers: {
        get: () => "127.0.0.1",
      },
    };

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.xpAwarded).toBe(15);
    expect(mockCollection.insertOne).toHaveBeenCalled();
    expect(awardXp).toHaveBeenCalledWith(
      "user-123",
      "focus_session_completed",
      {}
    );
  });

  test("records a break session and does not award XP", async () => {
    const request = {
      json: async () => ({
        duration: 5,
        completedAt: new Date().toISOString(),
        type: "break",
      }),
      headers: {
        get: () => "127.0.0.1",
      },
    };

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.xpAwarded).toBe(0);
    expect(mockCollection.insertOne).toHaveBeenCalled();
    expect(awardXp).not.toHaveBeenCalled();
  });

  test("rejects invalid request payload", async () => {
    const request = {
      json: async () => ({
        duration: "invalid-duration",
        completedAt: "invalid-date",
        type: "invalid-type",
      }),
      headers: {
        get: () => "127.0.0.1",
      },
    };

    await expect(POST(request)).rejects.toThrow();
  });
});
