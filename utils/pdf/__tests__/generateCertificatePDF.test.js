import { describe, test, expect, vi, beforeEach } from "vitest";
import { generateCertificatePDF } from "../generateCertificatePDF";

// Create a mock doc instance before mocking the module
const mockDoc = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  line: vi.fn(),
  setFont: vi.fn(),
  save: vi.fn(),
  rect: vi.fn(),
  setFillColor: vi.fn(),
  triangle: vi.fn(),
  polygon: vi.fn(),
  circle: vi.fn(),
  moveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  stroke: vi.fn(),
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 297),
      getHeight: vi.fn(() => 210),
    },
  },
};

vi.mock("jspdf", () => {
  return {
    default: vi.fn(function () { return mockDoc; }),
  };
});

describe("generateCertificatePDF Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("generates and saves certificate PDF with correct student and course info", () => {
    const filename = generateCertificatePDF({
      studentName: "Jane Doe",
      courseTitle: "React Native Deep Dive",
      completionDate: "June 2, 2026",
      instructorName: "Sarah Jenkins",
    });

    expect(filename).toBe("certificate-react-native-deep-dive.pdf");
    expect(mockDoc.save).toHaveBeenCalledWith(
      "certificate-react-native-deep-dive.pdf"
    );

    // Check that student name was written
    expect(mockDoc.text).toHaveBeenCalledWith(
      "Jane Doe",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );

    // Check that course title was written
    expect(mockDoc.text).toHaveBeenCalledWith(
      "React Native Deep Dive",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );

    // Check that instructor was written
    expect(mockDoc.text).toHaveBeenCalledWith(
      "Sarah Jenkins",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );

    // Check that A4 dimensions were queried
    expect(mockDoc.internal.pageSize.getWidth).toHaveBeenCalled();
    expect(mockDoc.internal.pageSize.getHeight).toHaveBeenCalled();
  });

  test("uses default values if parameters are missing", () => {
    const filename = generateCertificatePDF({});

    expect(filename).toBe("certificate-advanced-course.pdf");
    expect(mockDoc.save).toHaveBeenCalledWith(
      "certificate-advanced-course.pdf"
    );
    expect(mockDoc.text).toHaveBeenCalledWith(
      "Learnova Student",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });
});
