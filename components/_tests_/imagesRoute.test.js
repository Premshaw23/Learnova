jest.mock("next/server", () => ({
  NextResponse: jest.fn().mockImplementation((body, init) => ({
    status: init?.status || 200,
    body,
    headers: new Map(Object.entries(init?.headers || {})),
  })),
}));

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

// Mock mongodb ObjectId to avoid importing ESM-built bson code during tests
jest.mock("mongodb", () => ({
  ObjectId: class ObjectId {
    constructor(id) {
      this.id = id;
    }
    toString() {
      return String(this.id);
    }
  },
}));

jest.mock("@/lib/rbac", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}));

jest.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
}));

jest.mock("@/lib/errors", () => ({
  AppError: class AppError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  },
  ValidationError: class ValidationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
}));

const { GET } = require("@/app/api/images/route");

const { connectDb } = require("@/lib/mongodb");
const { requireAuth, requireRole } = require("@/lib/rbac");

describe("GET /api/images - authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const createReq = (id, headers = {}) => ({
    url: `http://localhost/api/images?id=${encodeURIComponent(id)}`,
    headers: {
      get: jest.fn().mockImplementation((name) => headers[name.toLowerCase()] || null),
    },
  });

  test("owner can fetch their image", async () => {
    requireAuth.mockResolvedValue({ uid: "owner-uid" });

    const userDoc = { image: "https://public.blob.vercel-storage.com/a.jpg", firebaseUid: "owner-uid" };
    connectDb.mockResolvedValue({ collection: () => ({ findOne: jest.fn().mockResolvedValue(userDoc) }) });

    global.fetch.mockResolvedValue({ ok: true, headers: { get: () => "image/jpeg" }, arrayBuffer: async () => Buffer.from([1, 2, 3]).buffer });

    const req = createReq("someObjectId");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(userDoc.image);
  });

  test("non-owner without privileges is forbidden", async () => {
    requireAuth.mockResolvedValue({ uid: "attacker-uid" });
    requireRole.mockImplementation(() => { throw new Error("not allowed"); });

    const userDoc = { image: "https://public.blob.vercel-storage.com/a.jpg", firebaseUid: "owner-uid" };
    connectDb.mockResolvedValue({ collection: () => ({ findOne: jest.fn().mockResolvedValue(userDoc) }) });

    const req = createReq("someObjectId");

    await expect(GET(req)).rejects.toThrow("Forbidden");
  });

  test("privileged role can fetch other user's image", async () => {
    requireAuth.mockResolvedValue({ uid: "attacker-uid" });
    requireRole.mockResolvedValue(true);

    const userDoc = { image: "https://public.blob.vercel-storage.com/a.jpg", firebaseUid: "owner-uid" };
    connectDb.mockResolvedValue({ collection: () => ({ findOne: jest.fn().mockResolvedValue(userDoc) }) });

    global.fetch.mockResolvedValue({ ok: true, headers: { get: () => "image/png" }, arrayBuffer: async () => Buffer.from([4,5,6]).buffer });

    const req = createReq("someObjectId");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(userDoc.image);
  });

  test("invalid id parameter results in validation error", async () => {
    const req = { url: `http://localhost/api/images`, headers: { get: jest.fn().mockReturnValue(null) } };
    await expect(GET(req)).rejects.toThrow();
  });
});
