import { vi } from "vitest";
import { POST, GET as getNoticesRoute } from "@/app/api/notices/route";
import { GET, publishNoticeToRedis } from "@/app/api/notices/stream/route";
import {
  getAdminDb,
  getUserProfile,
  verifyFirebaseToken,
} from "@/lib/firebase-admin";
import { connectDb, connectDbForSSE } from "../../lib/mongodb";

// Mock NextResponse
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

// Mock Upstash Redis
const mockRedisZadd = vi.fn().mockResolvedValue(1);
const mockRedisExpire = vi.fn().mockResolvedValue(1);
const mockRedisIncr = vi.fn().mockResolvedValue(1);
const mockRedisDecr = vi.fn().mockResolvedValue(0);
const mockRedisSet = vi.fn().mockResolvedValue("OK");
const mockRedisZrange = vi.fn().mockResolvedValue([]);

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    zadd: mockRedisZadd,
    expire: mockRedisExpire,
    incr: mockRedisIncr,
    decr: mockRedisDecr,
    set: mockRedisSet,
    zrange: mockRedisZrange,
  })),
}));

process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

// Mock firebase admin
vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
  getUserProfile: vi.fn(),
  getAdminDb: vi.fn(),
}));

// Mock MongoDB
const mockMongoInsert = vi.fn();
const mockMongoCountDocuments = vi.fn().mockResolvedValue(0);
const mockMongoFindToArray = vi.fn().mockResolvedValue([]);
const mockMongoFind = vi.fn().mockReturnValue({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  toArray: mockMongoFindToArray,
});

vi.mock("../../lib/mongodb", () => ({
  connectDb: vi.fn(),
  connectDbForSSE: vi.fn(),
}));

// Mock ReadableStream to capture its start function
let capturedStart = null;
const originalReadableStream = global.ReadableStream;

beforeAll(() => {
  global.ReadableStream = class {
    constructor(options) {
      capturedStart = options.start;
    }
  };
  global.Response = class {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    async json() {
      return typeof this.body === "string" ? JSON.parse(this.body) : this.body;
    }
  };
});

afterAll(() => {
  global.ReadableStream = originalReadableStream;
  delete global.Response;
});

describe("Notice Board Isolation & Security Tests", () => {
  let mockFirestoreAdd;
  let originalConsoleError;
  let originalEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedStart = null;

    // Set Redis env vars for tests
    originalEnv = process.env;
    process.env = { ...originalEnv };
    process.env.UPSTASH_REDIS_REST_URL = "http://localhost:8080";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    mockFirestoreAdd = vi.fn().mockResolvedValue({ id: "mock-notice-id" });
    getAdminDb.mockReturnValue({
      collection: vi.fn().mockReturnValue({
        add: mockFirestoreAdd,
      }),
    });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        insertOne: mockMongoInsert,
        find: mockMongoFind,
        countDocuments: mockMongoCountDocuments,
        distinct: vi.fn().mockResolvedValue([]),
      }),
    });

    connectDbForSSE.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        find: mockMongoFind,
      }),
    });

    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    process.env = originalEnv;
  });

  const createMockRequest = (
    headers,
    bodyData,
    url = "http://localhost/api/notices"
  ) => {
    return {
      url,
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: vi.fn().mockResolvedValue(bodyData),
      text: vi.fn().mockResolvedValue(JSON.stringify(bodyData)),
      signal: {
        addEventListener: vi.fn(),
      },
    };
  };

  describe("POST /api/notices - Notice Creation", () => {
    test("automatically appends publisher instituteId to notice and syncs to MongoDB", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "publisher-123",
          email: "teacher@domain.com",
          name: "Teacher Jane",
          email_verified: true,
          role: "teacher",
        },
      });
      getUserProfile.mockResolvedValue({
        role: "teacher",
        instituteId: "institute_A",
      });

      const payload = {
        title: "Exam Schedule",
        content: "Exams start next Monday.",
        category: "academic",
        priority: "high",
        isPinned: false,
        tags: ["exams"],
        targetAudience: ["student"],
      };

      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        payload
      );
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify Firestore add
      expect(mockFirestoreAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Exam Schedule",
          instituteId: "institute_A",
          authorId: "publisher-123",
          authorRole: "teacher",
        })
      );

      // Verify MongoDB sync
      expect(mockMongoInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Exam Schedule",
          instituteId: "institute_A",
          authorId: "publisher-123",
          _id: "mock-notice-id",
        })
      );
    });

    test("denies notice creation for unauthorized roles (like student) with 403", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "student-123",
          email: "student@domain.com",
          email_verified: true,
          role: "student",
        },
      });
      getUserProfile.mockResolvedValue({
        role: "student",
        instituteId: "institute_A",
      });

      const payload = {
        title: "Student Rant",
        content: "Too much homework.",
        category: "general",
        priority: "low",
        targetAudience: ["student"],
      };

      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        payload
      );
      const response = await POST(req);
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain("Forbidden");
      expect(body.errorObj.code).toBe("HTTP_403");
      expect(mockFirestoreAdd).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/notices/stream - SSE Real-Time Stream", () => {
    test("filters initial MongoDB query by user instituteId", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "student-123",
          email: "student@domain.com",
          email_verified: true,
        },
      });
      getUserProfile.mockResolvedValue({
        role: "student",
        instituteId: "institute_B",
      });

      const mockNotices = [
        {
          _id: "notice-1",
          title: "Notice B1",
          instituteId: "institute_B",
          targetAudience: ["student"],
        },
      ];
      mockMongoFindToArray.mockResolvedValue(mockNotices);

      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        {},
        "http://localhost/api/notices/stream"
      );
      await GET(req);

      expect(capturedStart).toBeDefined();

      const mockController = {
        enqueue: vi.fn(),
        close: vi.fn(),
      };

      await capturedStart(mockController);

      // Verify DB find query contains the correct instituteId filter
      expect(mockMongoFind).toHaveBeenCalledWith(
        expect.objectContaining({
          targetAudience: "student",
          instituteId: "institute_B",
        })
      );

      // Verify the initial data is sent
      expect(mockController.enqueue).toHaveBeenCalled();
      const firstCallArg = mockController.enqueue.mock.calls[0][0];
      const decoder = new TextDecoder();
      const decodedString = decoder.decode(firstCallArg);
      expect(decodedString).toContain("event: initial");
      expect(decodedString).toContain("Notice B1");
    });

    test("publishNoticeToRedis adds notice to Redis sorted set", async () => {
      const testDoc = {
        _id: "notice-123",
        title: "Test Notice",
        targetAudience: ["student"],
        instituteId: "institute_A",
        createdAt: new Date(),
      };

      await publishNoticeToRedis(testDoc);

      expect(mockRedisZadd).toHaveBeenCalledWith(
        "sse:notices:recent",
        expect.objectContaining({
          score: expect.any(Number),
          member: expect.any(String),
        })
      );
      expect(mockRedisExpire).toHaveBeenCalledWith("sse:notices:recent", 86400);
    });

    test("POST creates notice and syncs to MongoDB without Redis publish", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "publisher-123",
          email: "teacher@domain.com",
          name: "Teacher Jane",
          email_verified: true,
          role: "teacher",
        },
      });
      getUserProfile.mockResolvedValue({
        role: "teacher",
        instituteId: "institute_A",
      });

      const payload = {
        title: "Exam Schedule",
        content: "Exams start next Monday.",
        category: "academic",
        priority: "high",
        isPinned: false,
        tags: ["exams"],
        targetAudience: ["student"],
      };

      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        payload
      );
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    test("GET /api/notices/stream - fallback instituteId to uid when profile has no instituteId", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "student-456",
          email: "student2@domain.com",
          email_verified: true,
        },
      });
      // Return profile without instituteId
      getUserProfile.mockResolvedValue({
        role: "student",
      });

      mockMongoFindToArray.mockResolvedValue([]);

      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        {},
        "http://localhost/api/notices/stream"
      );
      await GET(req);

      expect(capturedStart).toBeDefined();

      const mockController = {
        enqueue: vi.fn(),
        close: vi.fn(),
      };

      await capturedStart(mockController);

      // Verify DB find query uses "student-456" (uid) as instituteId
      expect(mockMongoFind).toHaveBeenCalledWith(
        expect.objectContaining({
          targetAudience: "student",
          instituteId: "student-456",
        })
      );
    });
  });

  describe("GET /api/notices - Query, Paginate, and Stats", () => {
    test("retrieves paginated notices and dynamic stats based on filters", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "student-123",
          email: "student@domain.com",
          email_verified: true,
          role: "student",
        },
      });
      getUserProfile.mockResolvedValue({
        role: "student",
        instituteId: "institute_A",
        readNotices: ["notice-1"],
      });

      const mockNotices = [
        {
          _id: "notice-2",
          title: "Exam Notice",
          content: "Exams next week.",
          category: "academic",
          priority: "high",
          isPinned: true,
          createdAt: new Date(),
        },
      ];

      mockMongoFindToArray.mockResolvedValue(mockNotices);
      mockMongoCountDocuments
        .mockResolvedValueOnce(5)  // total
        .mockResolvedValueOnce(1)  // pinned
        .mockResolvedValueOnce(2)  // high
        .mockResolvedValueOnce(4)  // unread
        .mockResolvedValueOnce(1); // totalNotices matching filters

      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        null,
        "http://localhost/api/notices?page=1&limit=5&category=academic&priority=high&search=Exam"
      );

      const response = await getNoticesRoute(req);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.notices).toHaveLength(1);
      expect(body.notices[0].id).toBe("notice-2");
      expect(body.notices[0].title).toBe("Exam Notice");
      expect(body.stats).toEqual({
        total: 5,
        unread: 4,
        pinned: 1,
        high: 2,
      });
      expect(body.totalNotices).toBe(1);

      // Verify DB find query filters
      expect(mockMongoFind).toHaveBeenCalledWith(
        expect.objectContaining({
          targetAudience: "student",
          instituteId: "institute_A",
          category: "academic",
          priority: "high",
          $or: expect.arrayContaining([
            expect.objectContaining({ title: expect.any(RegExp) }),
          ]),
        })
      );
    });

    test("handles unread filtering correctly when showOnlyUnread is true", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "student-123",
          email: "student@domain.com",
          email_verified: true,
          role: "student",
        },
      });
      getUserProfile.mockResolvedValue({
        role: "student",
        instituteId: "institute_A",
        readNotices: ["notice-1"],
      });

      mockMongoFindToArray.mockResolvedValue([]);
      mockMongoCountDocuments.mockResolvedValue(0);

      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        null,
        "http://localhost/api/notices?showOnlyUnread=true"
      );

      await getNoticesRoute(req);

      expect(mockMongoFind).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: { $nin: ["notice-1"] },
        })
      );
    });
  });
});
