import { POST } from "@/app/api/notices/route";
import { GET } from "@/app/api/notices/stream/route";
import { getAdminDb, getUserProfile, verifyFirebaseToken } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
        headers: new Map(),
      };
    }),
  },
}));

// Mock firebase admin
jest.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: jest.fn(),
  getUserProfile: jest.fn(),
  getAdminDb: jest.fn(),
}));

// Mock MongoDB
const mockMongoInsert = jest.fn();
const mockMongoFindToArray = jest.fn();
const mockMongoFind = jest.fn().mockReturnValue({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  toArray: mockMongoFindToArray,
});

let changeStreamCallback = null;
const mockWatchStream = {
  on: jest.fn().mockImplementation((event, cb) => {
    if (event === "change") {
      changeStreamCallback = cb;
    }
  }),
  close: jest.fn(),
};

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
  connectDbForSSE: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    capturedStart = null;

    mockFirestoreAdd = jest.fn().mockResolvedValue({ id: "mock-notice-id" });
    getAdminDb.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        add: mockFirestoreAdd,
      }),
    });

    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        insertOne: mockMongoInsert,
      }),
    });

    const { connectDbForSSE } = require("@/lib/mongodb");
    connectDbForSSE.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        find: mockMongoFind,
        watch: jest.fn().mockReturnValue(mockWatchStream),
      }),
    });

    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  const createMockRequest = (headers, bodyData, url = "http://localhost/api/notices") => {
    return {
      url,
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: jest.fn().mockResolvedValue(bodyData),
      text: jest.fn().mockResolvedValue(JSON.stringify(bodyData)),
      signal: {
        addEventListener: jest.fn(),
      },
    };
  };

  describe("POST /api/notices - Notice Creation", () => {
    test("automatically appends publisher instituteId to notice and syncs to MongoDB", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: { uid: "publisher-123", email: "teacher@domain.com", name: "Teacher Jane" },
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

      const req = createMockRequest({ authorization: "Bearer valid-token" }, payload);
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

    test("rejects standard students from creating notices", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: { uid: "student-123", email: "student@domain.com" },
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

      const req = createMockRequest({ authorization: "Bearer valid-token" }, payload);
      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toContain("Forbidden");
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
        },
      });
      getUserProfile.mockResolvedValue({
        role: "student",
        instituteId: "institute_B",
      });

      const mockNotices = [
        { _id: "notice-1", title: "Notice B1", instituteId: "institute_B", targetAudience: ["student"] },
      ];
      mockMongoFindToArray.mockResolvedValue(mockNotices);

      const req = createMockRequest({ authorization: "Bearer valid-token" }, {}, "http://localhost/api/notices/stream");
      await GET(req);

      expect(capturedStart).toBeDefined();

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
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

    test("filters real-time broadcasts (onNotice) to enforce institute boundaries", async () => {
      verifyFirebaseToken.mockResolvedValue({
        valid: true,
        decodedToken: {
          uid: "student-123",
          email: "student@domain.com",
        },
      });
      getUserProfile.mockResolvedValue({
        role: "student",
        instituteId: "institute_B",
      });

      mockMongoFindToArray.mockResolvedValue([]);

      const req = createMockRequest({ authorization: "Bearer valid-token" }, {}, "http://localhost/api/notices/stream");
      await GET(req);

      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn(),
      };

      await capturedStart(mockController);

      expect(changeStreamCallback).toBeDefined();

      // Trigger change stream event with notice from the SAME institute
      const decoder = new TextDecoder();
      changeStreamCallback({
        fullDocument: {
          _id: "notice-same",
          title: "Same Institute",
          targetAudience: ["student"],
          instituteId: "institute_B",
        },
      });

      // Verify the notice event is enqueued for same-institute user
      const sameCalls = mockController.enqueue.mock.calls;
      expect(sameCalls.length).toBeGreaterThan(0);
      const enqueuedText = decoder.decode(sameCalls[sameCalls.length - 1][0]);
      expect(enqueuedText).toContain("event: new-notice");
      expect(enqueuedText).toContain("Same Institute");

      // Reset mock controller tracking
      mockController.enqueue.mockClear();

      // Trigger change stream event with notice from a DIFFERENT institute
      changeStreamCallback({
        fullDocument: {
          _id: "notice-diff",
          title: "Diff Institute",
          targetAudience: ["student"],
          instituteId: "institute_A",
        },
      });

      // Verify that the notice event is NOT enqueued for different institute
      expect(mockController.enqueue).not.toHaveBeenCalled();
    });
  });
});
