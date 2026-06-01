import { GET } from "./route";
import { connectDb } from "@/lib/mongodb";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

function cronRequest(authorization) {
  return new Request("https://learnova.test/api/cron/attendance-risk", {
    headers: authorization ? { authorization } : {},
  });
}

describe("attendance risk cron authorization", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    vi.clearAllMocks();

    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  test("fails closed before connecting to the database when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(cronRequest("Bearer undefined"));

    expect(response.status).toBe(500);
    expect(connectDb).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "Internal server error",
    });
  });
});
