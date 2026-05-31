export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const inFlight = new Map();

function getCacheKey(url, options = {}) {
  if (options.cacheKey) return options.cacheKey;
  const method = options.method || "GET";
  let bodyStr = "";
  if (options.body) {
    if (typeof options.body === "string") {
      bodyStr = options.body;
    } else {
      try {
        bodyStr = JSON.stringify(options.body);
      } catch {
        bodyStr = String(options.body);
      }
    }
  }
  return `${method}:${url}:${bodyStr}`;
}

export async function apiFetch(url, options = {}) {
  const key = getCacheKey(url, options);

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    const {
      method = "GET",
      body,
      headers = {},
      timeoutMs = 30000,
      ...rest
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      let requestBody = body;
      const requestHeaders = { ...headers };

      if (
        body &&
        typeof body === "object" &&
        !(body instanceof FormData) &&
        !(body instanceof URLSearchParams)
      ) {
        requestBody = JSON.stringify(body);
        if (!requestHeaders["Content-Type"] && !requestHeaders["content-type"]) {
          requestHeaders["Content-Type"] = "application/json";
        }
      }

      const response = await fetch(url, {
        method,
        body: requestBody,
        headers: requestHeaders,
        signal: controller.signal,
        ...rest,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch {
            // Ignore JSON parsing failure
          }
        }

        if (!errorData) {
          try {
            errorData = { message: await response.text() };
          } catch {
            errorData = { message: `HTTP Error ${response.status}` };
          }
        }

        let message = "";
        let code = `HTTP_${response.status}`;

        if (errorData) {
          if (typeof errorData.error === "object" && errorData.error !== null) {
            message =
              errorData.error.message ||
              errorData.error.error ||
              JSON.stringify(errorData.error);
            code = errorData.error.code || code;
          } else if (typeof errorData.error === "string") {
            message = errorData.error;
          } else if (errorData.message) {
            message = errorData.message;
            code = errorData.code || code;
          } else {
            message = JSON.stringify(errorData);
          }
        }

        throw new ApiError(
          message || `HTTP Error ${response.status}`,
          code,
          response.status
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await response.json();
      }
      return await response.text();
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err.name === "AbortError") {
        throw new ApiError("Request timed out", "TIMEOUT", 408);
      }

      throw new ApiError(err.message || "Network error", "NETWORK_ERROR", 0);
    }
  })();

  inFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
