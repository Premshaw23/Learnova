import { requireAuth } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { POST, GET } from "@/app/api/conversations/route";
import { connectDb } from "@/lib/mongodb";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
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
  headers: {
    get: (name) => headers[name.toLowerCase()] || null,
  },
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  url,
});

describe("POST /api/conversations - Auth Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockReset();
  });

  test("rejects unauthenticated request with 401 when requireAuth throws", async () => {
    requireAuth.mockRejectedValue(new AppError("Unauthorized", 401));

    const req = createMockRequest(
      {},
      { userMessage: "Hi", botMessage: "Hello" }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  test("rejects request with invalid auth token", async () => {
    requireAuth.mockRejectedValue(new AppError("Unauthorized", 401));

    const req = createMockRequest(
      { authorization: "Bearer invalid-token" },
      { userMessage: "Hi", botMessage: "Hello" }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  test("accepts valid authenticated request", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123", sub: "user-123" });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userMessage: "Hi", botMessage: "Hello" }
    );
    const response = await POST(req);

    expect(response.status).toBe(200);
  });
});
