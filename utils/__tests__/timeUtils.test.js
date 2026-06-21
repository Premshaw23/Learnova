import { describe, it, expect } from "vitest";
import { formatTimestamp } from "../timeUtils";

describe("formatTimestamp", () => {
  it("should format 0 seconds to 00:00:00", () => {
    expect(formatTimestamp(0)).toBe("00:00:00");
  });

  it("should format seconds under a minute", () => {
    expect(formatTimestamp(45)).toBe("00:00:45");
  });

  it("should format minutes and seconds", () => {
    expect(formatTimestamp(125)).toBe("00:02:05");
  });

  it("should format hours, minutes, and seconds", () => {
    expect(formatTimestamp(3661)).toBe("01:01:01");
    expect(formatTimestamp(7322)).toBe("02:02:02");
  });

  it("should handle floating point numbers by flooring them", () => {
    expect(formatTimestamp(125.7)).toBe("00:02:05");
  });

  it("should default to 00:00:00 for negative numbers", () => {
    expect(formatTimestamp(-10)).toBe("00:00:00");
  });

  it("should default to 00:00:00 for NaN", () => {
    expect(formatTimestamp(NaN)).toBe("00:00:00");
  });

  it("should default to 00:00:00 for non-numeric types", () => {
    expect(formatTimestamp(null)).toBe("00:00:00");
    expect(formatTimestamp(undefined)).toBe("00:00:00");
    expect(formatTimestamp("120")).toBe("00:00:00");
    expect(formatTimestamp({})).toBe("00:00:00");
  });
});
