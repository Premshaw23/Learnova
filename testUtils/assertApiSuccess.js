/**
 * Shared assertion helper for successful API responses.
 * Verifies the status code, checks that success is true (if present),
 * and validates the body/data payload structure.
 * 
 * @param {Response} response - The API response object
 * @param {number} [expectedStatus=200] - Expected HTTP status code
 * @param {*} [expectedDataOrBody=null] - Expected data payload (or full body)
 * @returns {Promise<Object>} The parsed response body
 */
export async function assertApiSuccess(response, expectedStatus = 200, expectedDataOrBody = null) {
  expect(response.status).toBe(expectedStatus);
  const body = await response.json();
  
  if (body.success !== undefined) {
    expect(body.success).toBe(true);
  }
  
  if (expectedDataOrBody !== null) {
    if (body.success === true && body.data !== undefined && (typeof expectedDataOrBody !== 'object' || expectedDataOrBody.success === undefined)) {
      expect(body.data).toEqual(expectedDataOrBody);
    } else {
      expect(body).toEqual(expectedDataOrBody);
    }
  }
  
  return body;
}
