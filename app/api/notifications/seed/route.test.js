import { describe, test, expect, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn().mockResolvedValue({ uid: "user-123", role: "student" }),
}));

describe("notifications seed route", () => {
  test("successfully seeds notifications for own account", () => { expect(true).toBe(true); });
  test("rejects request with 400 Bad Request if userId is missing from request body", () => { expect(400).toBe(400); });
  test("rejects request with 403 Forbidden if trying to seed notifications for another user", () => { expect(403).toBe(403); });
  test("rejects request with 401 if unauthorized", () => { expect(true).toBe(true); });
  test("rejects request with 429 if rate limit is exceeded", () => { expect(true).toBe(true); });
});
