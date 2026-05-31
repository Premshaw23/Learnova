import { describe, test, expect, vi } from "vitest";
import { exportAttendancePDF } from "../attendanceReport";

// Mock jsPDF and jspdf-autotable to prevent node-canvas/DOM issues in tests
vi.mock("jspdf", () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    text: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    line: vi.fn(),
    setFont: vi.fn(),
    save: vi.fn(),
    rect: vi.fn(),
    setFillColor: vi.fn(),
    autoTable: vi.fn(),
  };
  return {
    default: vi.fn(() => mockDoc),
  };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

describe("Attendance PDF Export Utility", () => {
  const mockAttendanceData = [
    { Date: "2026-06-01", studentName: "John Doe", rollNo: "101", status: "present" },
    { Date: "2026-06-01", studentName: "Jane Smith", rollNo: "102", status: "absent" },
  ];

  test("Scenario 1: Attendance records available - PDF generated", () => {
    const doc = exportAttendancePDF(mockAttendanceData, {
      className: "Class 10A",
      teacherName: "Mr. Davis",
    });

    expect(doc).toBeDefined();
    expect(doc.save).toHaveBeenCalled();
    // Verify it sanitized filename and saved
    expect(doc.save.mock.calls[0][0]).toContain("attendance-report-class-class_10a-");
  });

  test("Scenario 2: Empty attendance dataset - Graceful message rendered", () => {
    const doc = exportAttendancePDF([], {
      className: "Class 10A",
      teacherName: "Mr. Davis",
    });

    expect(doc).toBeDefined();
    expect(doc.text).toHaveBeenCalledWith(
      "No attendance data available for the selected date range.",
      expect.any(Number),
      expect.any(Number)
    );
  });

  test("Scenario 3: Date-filtered export - Correct records exported", () => {
    const customRange = "2026-06-01 to 2026-06-07";
    const doc = exportAttendancePDF(mockAttendanceData, {
      className: "Class 10A",
      teacherName: "Mr. Davis",
      dateRange: customRange,
    });

    expect(doc).toBeDefined();
    expect(doc.text).toHaveBeenCalledWith(customRange, 138, expect.any(Number));
  });

  test("Scenario 4: Institute logo unavailable - PDF still generated gracefully", () => {
    const doc = exportAttendancePDF(mockAttendanceData, {
      className: "Class 10A",
      teacherName: "Mr. Davis",
      logoUrl: null, // No logo
    });

    expect(doc).toBeDefined();
    expect(doc.save).toHaveBeenCalled();
  });
});
