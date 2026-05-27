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
export async function assertApiError(response, expectedStatus, expectedError = null) {
  expect(response.status).toBe(expectedStatus);
  const body = await response.json();
  
  if (body.success !== undefined) {
    expect(body.success).toBe(false);
  }
  
  if (expectedError !== null) {
    if (typeof expectedError === 'object') {
      expect(body.error || body).toEqual(expectedError);
    } else {
      expect(body.error).toBe(expectedError);
    }
  }
  
  return body;
}
