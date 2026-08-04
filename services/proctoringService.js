/**
 * OpenCV Face Mesh Proctoring Service for Exam Attendance & Gaze Verification.
 * Performs facial landmark detection, multi-face verification, and head pose orientation tracking (#4235).
 */

export class FaceMeshProctoringEngine {
  constructor(options = {}) {
    this.maxGazeYawDegrees = options.maxGazeYawDegrees || 25;
    this.maxGazePitchDegrees = options.maxGazePitchDegrees || 20;
    this.minConfidenceScore = options.minConfidenceScore || 0.8;
  }

  /**
   * Process a single video frame / landmark snapshot for proctoring verification.
   * @param {Object} frameData { facesCount, landmarks: Array, yaw: number, pitch: number, confidence: number }
   */
  evaluateFrame(frameData = {}) {
    const { facesCount = 0, yaw = 0, pitch = 0, confidence = 1.0 } = frameData;

    const warnings = [];
    let isViolating = false;

    if (facesCount === 0) {
      isViolating = true;
      warnings.push("PROCTORING ALERT: No face detected in camera view.");
    } else if (facesCount > 1) {
      isViolating = true;
      warnings.push(
        `PROCTORING ALERT: Multiple faces detected (${facesCount} faces).`
      );
    }

    if (confidence < this.minConfidenceScore) {
      isViolating = true;
      warnings.push(
        `PROCTORING WARNING: Low facial identification confidence (${(confidence * 100).toFixed(0)}%).`
      );
    }

    if (Math.abs(yaw) > this.maxGazeYawDegrees) {
      isViolating = true;
      warnings.push(
        `PROCTORING WARNING: Excessive horizontal head rotation (gaze yaw: ${yaw.toFixed(1)}°).`
      );
    }

    if (Math.abs(pitch) > this.maxGazePitchDegrees) {
      isViolating = true;
      warnings.push(
        `PROCTORING WARNING: Excessive vertical head rotation (gaze pitch: ${pitch.toFixed(1)}°).`
      );
    }

    return {
      isValid: !isViolating,
      facesCount,
      gazeOrientation: { yaw, pitch },
      confidence,
      warnings,
    };
  }
}
