import { describe, it, expect, beforeEach, vi } from "vitest";
import { clearAuthSensitiveCaches } from "../useAuth";

describe("clearAuthSensitiveCaches", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deletes only auth-sensitive cache keys and preserves other caches", async () => {
    const deletedKeys = [];

    globalThis.caches = {
      keys: vi.fn().mockResolvedValue([
        "static-assets-v1",
        "image-cache",
        "google-fonts-cache",
        "auth-session-cache",
        "user-profile-cache",
        "api-token-cache",
      ]),
      delete: vi.fn().mockImplementation(async (key) => {
        deletedKeys.push(key);
        return true;
      }),
    };

    await clearAuthSensitiveCaches();

    expect(globalThis.caches.keys).toHaveBeenCalled();
    expect(deletedKeys).toEqual(["auth-session-cache", "user-profile-cache", "api-token-cache"]);
    expect(globalThis.caches.delete).toHaveBeenCalledTimes(3);
  });

  it("does nothing when caches is unavailable", async () => {
    const originalCaches = globalThis.caches;
    delete globalThis.caches;

    await expect(clearAuthSensitiveCaches()).resolves.toBeUndefined();

    globalThis.caches = originalCaches;
  });
});
