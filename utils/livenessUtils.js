/**
 * livenessUtils.js
 * Mathematical helpers for face-api.js 68-point landmarks to detect liveness.
 */

/**
 * Calculates the Euclidean distance between two points.
 * @param {{x: number, y: number}} point1 
 * @param {{x: number, y: number}} point2 
 * @returns {number}
 */
const euclideanDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
  );
};

/**
 * Calculates the Eye Aspect Ratio (EAR) for a single eye.
 * The eye parameter should be an array of 6 points representing the eye outline
 * as returned by faceapi.js landmarks.getLeftEye() or getRightEye().
 * 
 * The EAR formula is: (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 * 
 * @param {Array<{x: number, y: number}>} eye 
 * @returns {number}
 */
export const getEyeAspectRatio = (eye) => {
  if (!eye || eye.length !== 6) return 0;
  
  // Vertical distances
  const v1 = euclideanDistance(eye[1], eye[5]);
  const v2 = euclideanDistance(eye[2], eye[4]);
  
  // Horizontal distance
  const h = euclideanDistance(eye[0], eye[3]);
  
  if (h === 0) return 0; // Prevent division by zero
  
  const ear = (v1 + v2) / (2.0 * h);
  return ear;
};

/**
 * Averages the EAR of both left and right eyes.
 * @param {Array<{x: number, y: number}>} leftEye 
 * @param {Array<{x: number, y: number}>} rightEye 
 * @returns {number}
 */
export const getAverageEAR = (leftEye, rightEye) => {
  const leftEAR = getEyeAspectRatio(leftEye);
  const rightEAR = getEyeAspectRatio(rightEye);
  return (leftEAR + rightEAR) / 2.0;
};
