import { POST, GET } from "./route";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { awardXp } from "@/lib/gamification-service";

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

jest.mock("@/lib/rbac", () => ({
  requireRole: jest.fn(),
}));

jest.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
}));

jest.mock("@/lib/gamification-service", () => ({
  awardXp: jest.fn(),
}));

jest.mock("next/server", () => ({
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
    jest.clearAllMocks();

    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: "session-123" }),
      find: jest.fn(),
    };

    mockDb = {
      collection: jest.fn(() => mockCollection),
    };

    connectDb.mockResolvedValue(mockDb);
    requireRole.mockResolvedValue({ payload: { uid: "user-123" } });
  });

  test("successfully records a focus session and awards XP", async () => {
    awardXp.mockResolvedValue({ xpAwarded: 15 });

    const request = {
      json: async () => ({
        duration: 25,
        completedAt: new Date().toISOString(),
        type: "focus",
      }),
    };

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.xpAwarded).toBe(15);
    expect(mockCollection.insertOne).toHaveBeenCalled();
    expect(awardXp).toHaveBeenCalledWith("user-123", "focus_session_completed", {});
  });

  test("records a break session and does not award XP", async () => {
    const request = {
      json: async () => ({
        duration: 5,
        completedAt: new Date().toISOString(),
        type: "break",
      }),
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
    };

    await expect(POST(request)).rejects.toThrow();
  });
});
