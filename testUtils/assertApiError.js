/**
 * Shared assertion helper for failed API responses.
 * Verifies the status code, checks that success is false (if present),
 * and validates the error payload structure.
 *
 * @param {Response} response - The API response object
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {*} [expectedError=null] - Expected error message, code, or error payload
 * @returns {Promise<Object>} The parsed response body
 */
export async function assertApiError(
  response,
  expectedStatus,
  expectedError = null
) {
  expect(response.status).toBe(expectedStatus);
  const body = await response.json();

  if (body.success !== undefined) {
    expect(body.success).toBe(false);
  }

  if (expectedError !== null) {
    const errorBody = body.error ?? body;

    if (typeof expectedError === "object") {
      expect(errorBody).toEqual(expectedError);
    } else if (typeof errorBody === "object" && errorBody !== null) {
      expect(errorBody.message).toBe(expectedError);
    } else {
      expect(errorBody).toBe(expectedError);
    }
  }

  return body;
}
