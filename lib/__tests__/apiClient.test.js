import { apiFetch, ApiError } from "../apiClient";

describe("apiFetch", () => {
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("resolves JSON response correctly", async () => {
    const mockResponseData = { success: true, data: "test-data" };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name) => {
          if (name.toLowerCase() === "content-type") {
            return "application/json";
          }
          return null;
        },
      },
      json: jest.fn().mockResolvedValue(mockResponseData),
    });

    const result = await apiFetch("/api/test");
    expect(result).toEqual(mockResponseData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/test", expect.any(Object));
  });

  test("resolves text response correctly", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name) => {
          if (name.toLowerCase() === "content-type") {
            return "text/plain";
          }
          return null;
        },
      },
      text: jest.fn().mockResolvedValue("plain text"),
    });

    const result = await apiFetch("/api/text");
    expect(result).toBe("plain text");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("deduplicates simultaneous in-flight requests", async () => {
    const mockResponseData = { id: 1 };
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    global.fetch.mockImplementation(() =>
      fetchPromise.then(() => ({
        ok: true,
        headers: {
          get: (name) =>
            name.toLowerCase() === "content-type" ? "application/json" : null,
        },
        json: jest.fn().mockResolvedValue(mockResponseData),
      }))
    );

    // Call apiFetch three times concurrently
    const p1 = apiFetch("/api/dedupe");
    const p2 = apiFetch("/api/dedupe");
    const p3 = apiFetch("/api/dedupe");

    resolveFetch();

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toEqual(mockResponseData);
    expect(r2).toEqual(mockResponseData);
    expect(r3).toEqual(mockResponseData);

    // fetch should only have been called once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("does not deduplicate sequential requests", async () => {
    const mockResponseData = { id: 1 };
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name) =>
          name.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: jest.fn().mockResolvedValue(mockResponseData),
    });

    await apiFetch("/api/sequential");
    await apiFetch("/api/sequential");

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("triggers timeout if request takes too long", async () => {
    let abortCalled = false;
    global.fetch.mockImplementation((url, options) => {
      options.signal.addEventListener("abort", () => {
        abortCalled = true;
      });
      return new Promise((_, reject) => {
        // Reject immediately when signal aborts
        options.signal.addEventListener("abort", () => {
          const err = new Error("The user aborted a request.");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const fetchPromise = apiFetch("/api/timeout", { timeoutMs: 50 });

    // Advance timer past the 50ms timeout
    jest.advanceTimersByTime(60);

    await expect(fetchPromise).rejects.toThrow(ApiError);
    try {
      await fetchPromise;
    } catch (err) {
      expect(err.code).toBe("TIMEOUT");
      expect(err.status).toBe(408);
    }
    expect(abortCalled).toBe(true);
  });

  test("extracts error message from string error response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: {
        get: (name) =>
          name.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: jest.fn().mockResolvedValue({ error: "Invalid parameters" }),
    });

    try {
      await apiFetch("/api/error");
      fail("should have thrown ApiError");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.message).toBe("Invalid parameters");
      expect(err.code).toBe("HTTP_400");
      expect(err.status).toBe(400);
    }
  });

  test("extracts error message and code from object error response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: {
        get: (name) =>
          name.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: jest.fn().mockResolvedValue({
        error: { message: "Access denied", code: "FORBIDDEN" },
      }),
    });

    try {
      await apiFetch("/api/error-obj");
    } catch (err) {
      expect(err.message).toBe("Access denied");
      expect(err.code).toBe("FORBIDDEN");
      expect(err.status).toBe(403);
    }
  });

  test("extracts error message from plain text response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: {
        get: (name) =>
          name.toLowerCase() === "content-type" ? "text/plain" : null,
      },
      text: jest.fn().mockResolvedValue("Internal Server Error"),
    });

    try {
      await apiFetch("/api/text-error");
    } catch (err) {
      expect(err.message).toBe("Internal Server Error");
      expect(err.code).toBe("HTTP_500");
      expect(err.status).toBe(500);
    }
  });

  test("handles general network errors", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    try {
      await apiFetch("/api/network-error");
    } catch (err) {
      expect(err.message).toBe("Failed to fetch");
      expect(err.code).toBe("NETWORK_ERROR");
      expect(err.status).toBe(0);
    }
  });
});
