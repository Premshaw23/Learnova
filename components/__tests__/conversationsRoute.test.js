import { POST, GET } from "@/app/api/conversations/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
        headers: new Map(),
      };
    }),
  },
}));

vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

describe("POST /api/conversations - Authentication and Validation Security Tests", () => {
  let mockInsertOne;

  beforeEach(() => {
    vi.clearAllMocks();

    mockInsertOne = vi.fn();

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        insertOne: mockInsertOne,
      }),
    });
  });

  const createMockRequest = (headers, bodyData, rawTextOverride = null) => {
    const rawText = rawTextOverride !== null ? rawTextOverride : JSON.stringify(bodyData);
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: vi.fn().mockResolvedValue(bodyData),
      text: vi.fn().mockResolvedValue(rawText),
    };
  };

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({}, {
      userMessage: "Hello",
      botMessage: "Hi there!",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(mockInsertOne).not.toHaveBeenCalled();
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("rejects request with invalid token with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest(
      { authorization: "Bearer invalid-token" },
      {
        userMessage: "Hello",
        botMessage: "Hi there!",
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(mockInsertOne).not.toHaveBeenCalled();
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("accepts request with valid token, inserts conversation with userId/userEmail", async () => {
    const mockDecodedToken = {
      uid: "user-123",
      email: "user@example.com",
    };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);
    mockInsertOne.mockResolvedValue({ insertedId: "conv-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        userMessage: "Hello",
        botMessage: "Hi there!",
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe("user-123");
    expect(body.data.userEmail).toBe("user@example.com");
    expect(body.data.userMessage).toBe("Hello");
    expect(body.data.botMessage).toBe("Hi there!");
    expect(mockInsertOne).toHaveBeenCalled();
  });

  test("rejects request payload > 1MB with 413 Payload Too Large", async () => {
    const mockDecodedToken = { uid: "user-123", email: "user@example.com" };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);

    // Create a 1.1MB large string
    const largeMessage = "a".repeat(1.1 * 1024 * 1024);
    const req = createMockRequest(
      { authorization: "Bearer valid-token", "content-length": String(largeMessage.length) },
      { userMessage: largeMessage, botMessage: "Hi" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error.message).toBe("Payload too large");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects invalid JSON payload with 400 Bad Request", async () => {
    const mockDecodedToken = { uid: "user-123", email: "user@example.com" };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      null,
      "{ invalid-json }"
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid JSON payload");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects invalid field types with 400 Bad Request", async () => {
    const mockDecodedToken = { uid: "user-123", email: "user@example.com" };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        userMessage: 12345, // Number instead of string
        botMessage: "Hi",
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain("userMessage must be a string");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects missing required fields with 400 Bad Request", async () => {
    const mockDecodedToken = { uid: "user-123", email: "user@example.com" };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        userMessage: "Hello",
        // botMessage is missing
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toContain("botMessage is required");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("sanitizes text inputs to prevent XSS script injection", async () => {
    const mockDecodedToken = { uid: "user-123", email: "user@example.com" };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);
    mockInsertOne.mockResolvedValue({ insertedId: "conv-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        userMessage: "Hello <script>alert('XSS')</script>World",
        botMessage: "Friendly bot response",
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userMessage).toBe("Hello World"); // <script> tag stripped
    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: "Hello World",
      })
    );
  });

  test("strips HTML tags while preserving safe Markdown syntax", async () => {
    const mockDecodedToken = { uid: "user-123", email: "user@example.com" };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);
    mockInsertOne.mockResolvedValue({ insertedId: "conv-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        userMessage: "**Hello** <b>World</b> [docs](/courses)",
        botMessage: "<style>body{display:none}</style>Safe **reply**",
      }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userMessage).toBe("**Hello** World [docs](/courses)");
    expect(body.data.botMessage).toBe("Safe **reply**");
    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: "**Hello** World [docs](/courses)",
        botMessage: "Safe **reply**",
      })
    );
  });
});

describe("GET /api/conversations - History Retrieval Security and Performance Tests", () => {
  let mockFind, mockSort, mockLimit, mockToArray;

  beforeEach(() => {
    vi.clearAllMocks();

    mockToArray = vi.fn();
    mockLimit = vi.fn().mockReturnValue({ toArray: mockToArray });
    mockSort = vi.fn().mockReturnValue({ limit: mockLimit });
    mockFind = vi.fn().mockReturnValue({ sort: mockSort });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        find: mockFind,
      }),
    });
  });

  const createMockRequest = (headers) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
    };
  };

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({});

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("rejects request with invalid token with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({ authorization: "Bearer invalid-token" });

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("accepts request with valid token, retrieves user-specific history sorted chronologically and limited to 50 records", async () => {
    const mockDecodedToken = {
      uid: "user-123",
      email: "user@example.com",
    };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);

    const dummyConversations = [
      {
        userId: "user-123",
        userEmail: "user@example.com",
        userMessage: "Hello",
        botMessage: "Hi",
        timestamp: new Date("2026-05-21T10:00:00Z"),
      },
      {
        userId: "user-123",
        userEmail: "user@example.com",
        userMessage: "How are you?",
        botMessage: "I'm great",
        timestamp: new Date("2026-05-21T10:01:00Z"),
      },
    ];
    mockToArray.mockResolvedValue(dummyConversations);

    const req = createMockRequest({ authorization: "Bearer valid-token" });

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(dummyConversations);

    expect(mockFind).toHaveBeenCalledWith({ userId: "user-123" });
    expect(mockSort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(mockLimit).toHaveBeenCalledWith(50);
  });

  test("returns empty array if user has no saved conversations", async () => {
    const mockDecodedToken = {
      uid: "user-456",
      email: "newuser@example.com",
    };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);
    mockToArray.mockResolvedValue([]);

    const req = createMockRequest({ authorization: "Bearer valid-token" });

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
    expect(mockFind).toHaveBeenCalledWith({ userId: "user-456" });
  });

  test("handles database connection/query errors gracefully returning 500", async () => {
    const mockDecodedToken = {
      uid: "user-123",
      email: "user@example.com",
    };
    verifyFirebaseToken.mockResolvedValue(mockDecodedToken);

    connectDb.mockRejectedValue(new Error("Database offline"));

    const req = createMockRequest({ authorization: "Bearer valid-token" });

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.message).toBe("Internal server error");
  });
});
