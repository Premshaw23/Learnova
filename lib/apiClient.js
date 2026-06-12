import { getClientCsrfToken, shouldAttachCsrfToken } from "@/lib/csrf";
import { handleOfflineRequest } from "../utils/offlineRequestHandler";

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

    let requestBody = body;
    const requestHeaders = { ...headers };
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
      method.toUpperCase()
    );
    const isClient = typeof window !== "undefined";

    try {
      if (isClient && !navigator.onLine && isMutation) {
        const offlineRes = await handleOfflineRequest(url, {
          method,
          body: requestBody,
          headers: requestHeaders,
        });
        return await offlineRes.json();
      }

      const csrfToken = getClientCsrfToken();
      if (csrfToken && shouldAttachCsrfToken(url, method)) {
        const existingToken =
          requestHeaders["x-csrf-token"] ||
          requestHeaders["X-CSRF-Token"] ||
          requestHeaders["x-xsrf-token"] ||
          requestHeaders["X-XSRF-TOKEN"] ||
          requestHeaders["x-csrftoken"] ||
          requestHeaders["X-CSRFToken"];
        requestHeaders["x-csrf-token"] = existingToken || csrfToken;
      }

      if (
        body &&
        typeof body === "object" &&
        !(body instanceof FormData) &&
        !(body instanceof URLSearchParams)
      ) {
        requestBody = JSON.stringify(body);
        if (
          !requestHeaders["Content-Type"] &&
          !requestHeaders["content-type"]
        ) {
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

      let errorMsg = err.message || "Network error";
      let isTimeout = err.name === "AbortError";
      const isNetworkError =
        errorMsg.includes("Failed to fetch") ||
        err.name === "TypeError" ||
        (typeof navigator !== "undefined" && !navigator.onLine);

      if (isClient && isMutation && isNetworkError) {
        try {
          const offlineRes = await handleOfflineRequest(url, {
            method,
            body: requestBody,
            headers: requestHeaders,
          });
          return await offlineRes.json();
        } catch (queueErr) {
          console.error("Failed to queue offline request:", queueErr);
        }
      }

      // We handle the toast globally here so that all frontend API calls
      // benefit from automatic error reporting without repeating toast.error
      // everywhere.
      if (isClient) {
        import("react-hot-toast")
          .then(({ toast }) => {
            if (isTimeout) {
              toast.error("Request timed out. Please try again.");
            } else {
              toast.error(errorMsg);
            }
          })
          .catch(() => {
            // Silently ignore if toast cannot be imported (e.g. testing environments)
          });
      }

      if (err instanceof ApiError) {
        throw err;
      }

      if (isTimeout) {
        throw new ApiError("Request timed out", "TIMEOUT", 408);
      }

      throw new ApiError(errorMsg, "NETWORK_ERROR", 0);
    }
  })();

  inFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}
