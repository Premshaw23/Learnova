import { GET as listGET } from "@/app/api/exceptions/list/route";
import { GET as allGET } from "@/app/api/exceptions/all/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";

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
  getUserProfile: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => {
  const mockCursor = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
  };
  const mockCollection = {
    countDocuments: vi.fn().mockResolvedValue(0),
    find: vi.fn().mockReturnValue(mockCursor),
  };
  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };
  return {
    connectDb: vi.fn().mockResolvedValue(mockDb),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

describe("Exceptions BOLA Security Tests", () => {
  let mockCollection;

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await connectDb();
    mockCollection = db.collection("exceptions");
  });

  const createMockRequest = (url = "http://localhost/api/exceptions", headers = {}) => {
    const headersMap = new Map(Object.entries({
      "x-forwarded-for": "127.0.0.1",
      "authorization": "Bearer valid-token",
      ...headers
    }));
    return {
      url,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  test("list: restricts teacher to their subjects", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "teacher-1", email: "teacher@domain.com", email_verified: true, role: "teacher" },
    });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Math", "Science"] });

    await listGET(createMockRequest("http://localhost/api/exceptions/list"));

    // Check that find was called with className / class in ["Math", "Science"]
    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: expect.arrayContaining([
          expect.objectContaining({
            $or: [
              { className: { $in: ["Math", "Science"] } },
              { class: { $in: ["Math", "Science"] } }
            ]
          })
        ])
      })
    );
  });

  test("all: restricts teacher to their subjects", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "teacher-1", email: "teacher@domain.com", email_verified: true, role: "teacher" },
    });
    getUserProfile.mockResolvedValue({ role: "teacher", subjects: ["Math", "Science"] });

    await allGET(createMockRequest("http://localhost/api/exceptions/all"));

    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: expect.arrayContaining([
          expect.objectContaining({
            $or: [
              { className: { $in: ["Math", "Science"] } },
              { class: { $in: ["Math", "Science"] } }
            ]
          })
        ])
      })
    );
  });

  test("all: allows admin to view all exceptions without subjects filter", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "admin-1", email: "admin@domain.com", email_verified: true, role: "admin" },
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    await allGET(createMockRequest("http://localhost/api/exceptions/all"));

    expect(mockCollection.find).toHaveBeenCalledWith({});
  });
});
