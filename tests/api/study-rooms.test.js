import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
  authenticateRequest: vi.fn(),
  parseJSON: vi.fn(),
}));

vi.mock("@/lib/api-response", () => ({
  jsonSuccess: vi.fn((data, status = 200) => ({ json: async () => data, status })),
  jsonError: vi.fn((msg, status = 500) => ({ json: async () => ({ error: msg }), status })),
  success: vi.fn((data, meta = {}, status = 200) => ({ json: async () => ({ success: true, data, meta }), status })),
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            toArray: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
      findOne: vi.fn().mockResolvedValue(null),
      updateOne: vi.fn().mockResolvedValue({}),
    })),
  })),
}));

vi.mock("@/lib/studyRoomManager", () => ({
  createRoom: vi.fn().mockResolvedValue({
    _id: "mock-room-id",
    name: "Test Room",
    hostId: "user-123",
    hostName: "Test User",
    status: "active",
  }),
  getRoom: vi.fn().mockResolvedValue({
    _id: "mock-room-id",
    name: "Test Room",
    hostId: "user-123",
    hostName: "Test User",
    status: "active",
  }),
  getParticipants: vi.fn().mockResolvedValue([]),
  joinRoom: vi.fn().mockResolvedValue({ userId: "user-123", userName: "Test" }),
  leaveRoom: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue({
    _id: "msg-123",
    content: "Hello",
    userId: "user-123",
  }),
  getMessages: vi.fn().mockResolvedValue([]),
  updateHeartbeat: vi.fn().mockResolvedValue(undefined),
  endRoom: vi.fn().mockResolvedValue(undefined),
  updateRoom: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/errors", () => ({
  AppError: class AppError extends Error {
    constructor(msg, status = 500) {
      super(msg);
      this.statusCode = status;
    }
  },
}));

import { authenticateRequest } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { GET, POST } from "@/app/api/study-rooms/route";
import {
  GET as RoomGET,
  PATCH as RoomPATCH,
  DELETE as RoomDELETE,
} from "@/app/api/study-rooms/[roomId]/route";
import {
  GET as ParticipantsGET,
  POST as ParticipantsPOST,
  PATCH as ParticipantsPATCH,
  DELETE as ParticipantsDELETE,
} from "@/app/api/study-rooms/[roomId]/participants/route";
import {
  GET as MessagesGET,
  POST as MessagesPOST,
} from "@/app/api/study-rooms/[roomId]/messages/route";

function makeRequest(method = "GET", url = "http://localhost/api/study-rooms", body = null) {
  const req = {
    method,
    headers: new Map([["content-type", "application/json"]]),
    url,
    nextUrl: new URL(url),
  };
  if (body) req.json = () => Promise.resolve(body);
  return req;
}

describe("Study Rooms API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({
      uid: "user-123",
      name: "Test User",
      email: "test@learnova.edu",
      role: "student",
      email_verified: true,
    });
  });

  describe("POST /api/study-rooms", () => {
    it("creates a new study room", async () => {
      const { parseJSON } = await import("@/lib/error-handler");
      parseJSON.mockResolvedValue({ name: "Math Study Group" });

      const response = await POST(makeRequest("POST", "http://localhost/api/study-rooms"));
      expect(response.status).toBe(201);
    });
  });

  describe("GET /api/study-rooms", () => {
    it("lists study rooms", async () => {
      const response = await GET(makeRequest("GET", "http://localhost/api/study-rooms"));
      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/study-rooms/[roomId]", () => {
    it("gets a specific room", async () => {
      const response = await RoomGET(
        makeRequest("GET", "http://localhost/api/study-rooms/room-1"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(200);
    });
  });

  describe("PATCH /api/study-rooms/[roomId]", () => {
    it("updates a room", async () => {
      const { parseJSON } = await import("@/lib/error-handler");
      parseJSON.mockResolvedValue({ name: "Updated Room Name" });

      const response = await RoomPATCH(
        makeRequest("PATCH", "http://localhost/api/study-rooms/room-1"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /api/study-rooms/[roomId]", () => {
    it("ends a room", async () => {
      const response = await RoomDELETE(
        makeRequest("DELETE", "http://localhost/api/study-rooms/room-1"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/study-rooms/[roomId]/participants", () => {
    it("joins a room", async () => {
      const response = await ParticipantsPOST(
        makeRequest("POST", "http://localhost/api/study-rooms/room-1/participants"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(201);
    });
  });

  describe("GET /api/study-rooms/[roomId]/participants", () => {
    it("lists participants", async () => {
      const response = await ParticipantsGET(
        makeRequest("GET", "http://localhost/api/study-rooms/room-1/participants"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(200);
    });
  });

  describe("PATCH /api/study-rooms/[roomId]/participants", () => {
    it("updates heartbeat", async () => {
      const { parseJSON } = await import("@/lib/error-handler");
      parseJSON.mockResolvedValue({ action: "heartbeat" });

      const response = await ParticipantsPATCH(
        makeRequest("PATCH", "http://localhost/api/study-rooms/room-1/participants"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /api/study-rooms/[roomId]/participants", () => {
    it("leaves a room", async () => {
      const response = await ParticipantsDELETE(
        makeRequest("DELETE", "http://localhost/api/study-rooms/room-1/participants"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/study-rooms/[roomId]/messages", () => {
    it("sends a message", async () => {
      const { parseJSON } = await import("@/lib/error-handler");
      parseJSON.mockResolvedValue({ content: "Hello everyone!" });

      const response = await MessagesPOST(
        makeRequest("POST", "http://localhost/api/study-rooms/room-1/messages"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(201);
    });
  });

  describe("GET /api/study-rooms/[roomId]/messages", () => {
    it("gets message history", async () => {
      const response = await MessagesGET(
        makeRequest("GET", "http://localhost/api/study-rooms/room-1/messages"),
        { params: Promise.resolve({ roomId: "room-1" }) }
      );
      expect(response.status).toBe(200);
    });
  });
});
