import { describe, it, expect, beforeEach } from "vitest";
import { FaceMeshProctoringEngine } from "../proctoringService";

describe("FaceMeshProctoringEngine Unit Tests", () => {
  let engine;

  beforeEach(() => {
    engine = new FaceMeshProctoringEngine({
      maxGazeYawDegrees: 25,
      maxGazePitchDegrees: 20,
      minConfidenceScore: 0.8,
    });
  });

  it("should validate normal single-face forward-looking frames", () => {
    const res = engine.evaluateFrame({
      facesCount: 1,
      yaw: 5,
      pitch: -3,
      confidence: 0.95,
    });
    expect(res.isValid).toBe(true);
    expect(res.warnings).toHaveLength(0);
  });

  it("should trigger alert when no face is detected", () => {
    const res = engine.evaluateFrame({ facesCount: 0 });
    expect(res.isValid).toBe(false);
    expect(res.warnings[0]).toContain("No face detected");
  });

  it("should trigger alert when multiple faces are detected", () => {
    const res = engine.evaluateFrame({ facesCount: 2, yaw: 0, pitch: 0 });
    expect(res.isValid).toBe(false);
    expect(res.warnings[0]).toContain("Multiple faces detected");
  });

  it("should trigger warning when head yaw exceeds threshold", () => {
    const res = engine.evaluateFrame({ facesCount: 1, yaw: 35, pitch: 0 });
    expect(res.isValid).toBe(false);
    expect(res.warnings[0]).toContain("Excessive horizontal head rotation");
  });
});
