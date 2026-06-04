import { logger } from "@/lib/logger";
import { authorizeCronRequest } from "@/lib/cronAuth";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

function cronRequest(authorization) {
  return new Request("https://learnova.test/api/cron/attendance-warnings", {
    headers: authorization ? { authorization } : {},
  });
}

async function responseBody(response) {
  return response.json();
}

describe("authorizeCronRequest", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    vi.clearAllMocks();

    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  test("fails closed when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;

    const result = authorizeCronRequest(cronRequest("Bearer undefined"));

    expect(result.authorized).toBe(false);
    expect(result.response.status).toBe(500);
    await expect(responseBody(result.response)).resolves.toMatchObject({
      success: false,
      error: "Internal server error",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[cronAuth] CRON_SECRET is not configured",
    );
  });

  test("fails closed when CRON_SECRET is blank", async () => {
    process.env.CRON_SECRET = "   ";

    const result = authorizeCronRequest(cronRequest("Bearer anything"));

    expect(result.authorized).toBe(false);
    expect(result.response.status).toBe(500);
  });

  test("rejects missing or incorrect authorization headers", async () => {
    process.env.CRON_SECRET = "expected-secret";

    const missing = authorizeCronRequest(cronRequest());
    const wrong = authorizeCronRequest(cronRequest("Bearer wrong-secret"));

    expect(missing.authorized).toBe(false);
    expect(missing.response.status).toBe(401);
    expect(wrong.authorized).toBe(false);
    expect(wrong.response.status).toBe(401);
  });

  test("authorizes a matching bearer token", () => {
    process.env.CRON_SECRET = "expected-secret";

    const result = authorizeCronRequest(cronRequest("Bearer expected-secret"));

    expect(result).toEqual({
      authorized: true,
      response: null,
    });
  });

  test("parses bearer scheme and surrounding whitespace robustly", () => {
    process.env.CRON_SECRET = " expected-secret ";

    const result = authorizeCronRequest(
      cronRequest("  bearer   expected-secret   "),
    );

    expect(result).toEqual({
      authorized: true,
      response: null,
    });
  });
});
