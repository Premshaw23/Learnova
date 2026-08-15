import { describe, expect, test } from "vitest";
import getApiRouteRule, {
  PUBLIC_API_PREFIXES,
  SERVICE_API_PREFIXES,
} from "@/lib/rbac-policy";

describe("getApiRouteRule specificity", () => {
  test("a specific rule declared after a generic one still wins", () => {
    const rule = getApiRouteRule("/api/notifications/seed");
    expect(rule.roles).toEqual(["admin"]);
  });

  test("the generic notifications rule still applies to sibling paths", () => {
    const rule = getApiRouteRule("/api/notifications");
    expect(rule.authOnly).toBe(true);
  });

  test("nested resource paths resolve to the most specific rule", () => {
    const rule = getApiRouteRule("/api/notifications/read");
    expect(rule.authOnly).toBe(true);
  });

  test("dashboard prefixes keep their role lists", () => {
    expect(getApiRouteRule("/api/student/achievements").roles).toEqual([
      "student",
      "admin",
    ]);
    expect(getApiRouteRule("/api/teacher/dashboard").roles).toEqual([
      "teacher",
      "admin",
    ]);
    expect(getApiRouteRule("/api/admin/users").roles).toEqual(["admin"]);
    expect(getApiRouteRule("/api/institute/settings").roles).toEqual([
      "institute",
      "admin",
    ]);
    expect(getApiRouteRule("/api/parent/children").roles).toEqual([
      "parent",
      "admin",
    ]);
  });

  test("unmatched api paths remain authenticated by default", () => {
    const rule = getApiRouteRule("/api/unknown/endpoint");
    expect(rule.authOnly).toBe(true);
  });
});

describe("getApiRouteRule public and service prefixes", () => {
  test("cron paths resolve to the service rule", () => {
    const rule = getApiRouteRule("/api/cron/attendance-risk");
    expect(rule.service).toBe(true);
  });

  test("cron path without trailing segment resolves to the service rule", () => {
    expect(getApiRouteRule("/api/cron").service).toBe(true);
  });

  test("public prefixes resolve to public", () => {
    expect(PUBLIC_API_PREFIXES).toContain("/api/timetable/ical");
    expect(PUBLIC_API_PREFIXES).toContain("/api/health");
    expect(getApiRouteRule("/api/timetable/ical/abc/feed.ics").public).toBe(
      true
    );
    expect(getApiRouteRule("/api/health/db").public).toBe(true);
    expect(getApiRouteRule("/api/health/rate-limit").public).toBe(true);
  });

  test("service prefixes are non-empty", () => {
    expect(SERVICE_API_PREFIXES.length).toBeGreaterThan(0);
  });
});
