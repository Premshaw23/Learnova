import { requireAuth } from "@/lib/rbac";
import { AppError, ValidationError } from "@/lib/errors";
import { POST, GET } from "@/app/api/conversations/route";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
  parseJSON: vi.fn(async (req) => {
    const raw = await req.text();
    return JSON.parse(raw);
  }),
}));

vi.mock("@/lib/api-response", () => ({
  jsonSuccess: (data) => ({
    status: 200,
    json: async () => ({ success: true, data }),
  }),
  jsonError: (message, status) => ({
    status,
    json: async () => ({ success: false, error: { message } }),
  }),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn().mockResolvedValue({
    collection: vi.fn().mockReturnValue({
      insertOne: vi.fn().mockResolvedValue({ insertedId: "test-id" }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              toArray: vi
                .fn()
                .mockResolvedValue([
                  { userMessage: "Hi", botMessage: "Hello" },
                ]),
            }),
          }),
        }),
      }),
    }),
  }),
}));

const createMockRequest = (
  headers,
  body,
  url = "http://localhost/api/conversations"
) => ({
  headers: new Headers(headers),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  url,
});

describe("POST /api/conversations - Auth and Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockReset();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  });

  test("rejects unauthenticated request with 401 when requireAuth throws", async () => {
    requireAuth.mockRejectedValue(new AppError("Unauthorized", 401));

    const req = createMockRequest(
      {},
      { userMessage: "Hi", botMessage: "Hello" }
    );
    await expect(POST(req)).rejects.toThrow("Unauthorized");
  });

  test("accepts valid authenticated request", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userMessage: "Hi", botMessage: "Hello" }
    );
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.userMessage).toBe("Hi");
    expect(body.data.botMessage).toBe("Hello");
  });

  test("rejects request with missing userMessage", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { botMessage: "Hello" }
    );
    await expect(POST(req)).rejects.toThrow();
  });

  test("rejects request with empty userMessage", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userMessage: "", botMessage: "Hello" }
    );
    await expect(POST(req)).rejects.toThrow();
  });

  test("rejects request with extra fields via strict schema", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userMessage: "Hi", botMessage: "Hello", injected: "payload" }
    );
    await expect(POST(req)).rejects.toThrow();
  });

  test("rejects request when rate limited", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userMessage: "Hi", botMessage: "Hello" }
    );
    const response = await POST(req);

    expect(response.status).toBe(429);
  });
});

describe("GET /api/conversations - Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  });

  test("returns conversations for authenticated user", async () => {
    const req = createMockRequest({}, null, "http://localhost/api/conversations");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("caps limit to MAX_PAGE_LIMIT", async () => {
    const req = createMockRequest(
      {},
      null,
      "http://localhost/api/conversations?limit=999999"
    );
    await GET(req);

    const collection = (await connectDb()).collection();
    const findChain = collection.find();
    const sortChain = findChain.sort();
    const skipChain = sortChain.skip();
    expect(skipChain.limit).toHaveBeenCalledWith(100);
  });

  test("rejects when rate limited", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });

    const req = createMockRequest({}, null, "http://localhost/api/conversations");
    const response = await GET(req);

    expect(response.status).toBe(429);
  });
});
