import { GET as listGET } from "@/app/api/exceptions/list/route";
import { GET as allGET } from "@/app/api/exceptions/all/route";
import { POST as createPOST } from "@/app/api/exceptions/create/route";
import { PUT as updatePUT } from "@/app/api/exceptions/update/route";
import { connectDb } from "@/lib/mongodb";
import {
  verifyFirebaseToken,
  getUserProfile,
  getUserProfileByEmail,
} from "@/lib/firebase-admin";

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
  getUserProfileByEmail: vi.fn(),
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
    insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
    findOne: vi.fn().mockResolvedValue(null),
    updateOne: vi.fn().mockResolvedValue({ matchedCount: 0 }),
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

  const createMockRequest = (
    url = "http://localhost/api/exceptions",
    headers = {},
    body = null
  ) => {
    const headersMap = new Map(
      Object.entries({
        "x-forwarded-for": "127.0.0.1",
        authorization: "Bearer valid-token",
        ...headers,
      })
    );
    const bodyStr = body ? JSON.stringify(body) : "";
    return {
      url,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
      text: async () => bodyStr,
      json: async () => body,
    };
  };

  test("list: restricts teacher to their subjects", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "teacher-1",
        email: "teacher@domain.com",
        email_verified: true,
        role: "teacher",
      },
    });
    getUserProfile.mockResolvedValue({
      role: "teacher",
      subjects: ["Math", "Science"],
      instituteId: "inst-1",
    });

    await listGET(createMockRequest("http://localhost/api/exceptions/list"));

    // Check that find was called with className / class in ["Math", "Science"]
    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId: "inst-1",
        $and: expect.arrayContaining([
          expect.objectContaining({
            $or: [
              { className: { $in: ["Math", "Science"] } },
              { class: { $in: ["Math", "Science"] } },
            ],
          }),
        ]),
      })
    );
  });

  test("all: restricts teacher to their subjects", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "teacher-1",
        email: "teacher@domain.com",
        email_verified: true,
        role: "teacher",
      },
    });
    getUserProfile.mockResolvedValue({
      role: "teacher",
      subjects: ["Math", "Science"],
      instituteId: "inst-1",
    });

    await allGET(createMockRequest("http://localhost/api/exceptions/all"));

    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId: "inst-1",
        $and: expect.arrayContaining([
          expect.objectContaining({
            $or: [
              { className: { $in: ["Math", "Science"] } },
              { class: { $in: ["Math", "Science"] } },
            ],
          }),
        ]),
      })
    );
  });

  test("all: allows admin to view all exceptions without subjects filter", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "admin-1",
        email: "admin@domain.com",
        email_verified: true,
        role: "admin",
      },
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    await allGET(createMockRequest("http://localhost/api/exceptions/all"));

    expect(mockCollection.find).toHaveBeenCalledWith({});
  });

  test("list: restricts student and teacher by their instituteId", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "student-1",
        email: "student@domain.com",
        email_verified: true,
        role: "student",
      },
    });
    getUserProfile.mockResolvedValue({
      role: "student",
      instituteId: "inst-A",
    });

    await listGET(createMockRequest("http://localhost/api/exceptions/list"));

    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId: "inst-A",
      })
    );
  });

  test("list: throws ForbiddenError if profile is missing instituteId and role is not admin", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "student-1",
        email: "student@domain.com",
        email_verified: true,
        role: "student",
      },
    });
    getUserProfile.mockResolvedValue({ role: "student" });

    const res = await listGET(
      createMockRequest("http://localhost/api/exceptions/list")
    );
    expect(res.status).toBe(403);
  });

  test("all: restricts admin with instituteId by their instituteId", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "admin-1",
        email: "admin@domain.com",
        email_verified: true,
        role: "admin",
      },
    });
    getUserProfile.mockResolvedValue({ role: "admin", instituteId: "inst-B" });

    await allGET(createMockRequest("http://localhost/api/exceptions/all"));

    expect(mockCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId: "inst-B",
      })
    );
  });

  test("create: injects user's instituteId into exceptionData", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "student-1",
        email: "student@domain.com",
        email_verified: true,
        role: "student",
      },
    });
    getUserProfile.mockResolvedValue({
      role: "student",
      instituteId: "inst-C",
    });

    const payload = {
      reason: "Medical Leave",
      details: "Sore throat and fever",
      date: "2026-06-04",
    };

    await createPOST(
      createMockRequest("http://localhost/api/exceptions/create", {}, payload)
    );

    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        studentEmail: "student@domain.com",
        instituteId: "inst-C",
        reason: "Medical Leave",
      })
    );
  });

  test("create: throws ForbiddenError if profile is missing instituteId", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "student-1",
        email: "student@domain.com",
        email_verified: true,
        role: "student",
      },
    });
    getUserProfile.mockResolvedValue({ role: "student" });

    const payload = {
      reason: "Medical Leave",
      details: "Sore throat and fever",
      date: "2026-06-04",
    };

    const res = await createPOST(
      createMockRequest("http://localhost/api/exceptions/create", {}, payload)
    );
    expect(res.status).toBe(403);
  });

  test("update: allows updating exception if instituteId matches", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "teacher-1",
        email: "teacher@domain.com",
        email_verified: true,
        role: "teacher",
      },
    });
    getUserProfile.mockResolvedValue({
      role: "teacher",
      instituteId: "inst-D",
      subjects: ["Math"],
    });

    // Mock existing exception in DB
    mockCollection.findOne.mockResolvedValue({
      _id: "60c72b2f9b1d8e2d8c8c8c8c",
      instituteId: "inst-D",
      className: "Math",
      studentEmail: "student@domain.com",
    });
    mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });

    const payload = {
      exceptionId: "60c72b2f9b1d8e2d8c8c8c8c",
      status: "approved",
      comments: "Approved",
    };

    const res = await updatePUT(
      createMockRequest("http://localhost/api/exceptions/update", {}, payload)
    );
    const data = await res.json();
    expect(data.message).toBe("Exception updated successfully");
  });

  test("update: throws ForbiddenError if exception has different instituteId", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "teacher-1",
        email: "teacher@domain.com",
        email_verified: true,
        role: "teacher",
      },
    });
    getUserProfile.mockResolvedValue({
      role: "teacher",
      instituteId: "inst-D",
      subjects: ["Math"],
    });

    // Mock existing exception in DB belonging to different institute
    mockCollection.findOne.mockResolvedValue({
      _id: "60c72b2f9b1d8e2d8c8c8c8c",
      instituteId: "inst-E",
      className: "Math",
      studentEmail: "student@domain.com",
    });

    const payload = {
      exceptionId: "60c72b2f9b1d8e2d8c8c8c8c",
      status: "approved",
      comments: "Approved",
    };

    const res = await updatePUT(
      createMockRequest("http://localhost/api/exceptions/update", {}, payload)
    );
    expect(res.status).toBe(403);
  });
});
