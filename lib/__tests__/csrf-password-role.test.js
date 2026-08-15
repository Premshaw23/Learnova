import { describe, expect, test } from "vitest";
import { validateCsrfRequest } from "../csrf";

describe("CSRF Token Protection for Sensitive Password & Role Modification API Routes (#4216)", () => {
  const mockCookieStore = (value) => ({
    get: (name) => (name === "csrfToken" ? { value } : null),
  });

  test("rejects password update requests lacking CSRF token header", () => {
    const req = {
      method: "POST",
      url: "https://learnova.app/api/user/update-password",
      headers: new Headers({ "content-type": "application/json" }),
      cookies: mockCookieStore("secret-csrf-token"),
    };
    expect(() => validateCsrfRequest(req)).toThrow("Forbidden: missing CSRF header (x-csrf-token)");
  });

  test("rejects role modification requests with mismatched CSRF token", () => {
    const req = {
      method: "PUT",
      url: "https://learnova.app/api/admin/user-role",
      headers: new Headers({ "x-csrf-token": "attacker-token" }),
      cookies: mockCookieStore("valid-user-csrf-token"),
    };
    expect(() => validateCsrfRequest(req)).toThrow("Forbidden: invalid CSRF token (mismatch)");
  });

  test("allows password and role modification requests with valid matching CSRF token", () => {
    const req = {
      method: "POST",
      url: "https://learnova.app/api/user/update-password",
      headers: new Headers({ "x-csrf-token": "valid-user-csrf-token" }),
      cookies: mockCookieStore("valid-user-csrf-token"),
    };
    expect(() => validateCsrfRequest(req)).not.toThrow();
  });
});
