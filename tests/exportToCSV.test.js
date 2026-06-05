import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportRiskToCSV } from "../utils/exportToCSV";

describe("AI Attendance Risk CSV Export Utility", () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => "mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("should successfully structure columns and generate download click trigger", () => {
    const mockData = [
      { studentId: "STU101", riskLevel: "High", tenantId: "school-alpha" },
    ];
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    exportRiskToCSV(mockData);

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
