import React, { useState } from "react";
import { exportRiskToCSV } from "../utils/exportToCSV";
import toast from "react-hot-toast";

export default function AIAttendanceDashboard({ riskData, tenantId }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const filteredData = riskData.filter(
        (item) => item.tenantId === tenantId
      );
      if (filteredData.length === 0) {
        toast.error("No data available for export.");
        return;
      }
      exportRiskToCSV(filteredData);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold">AI Attendance Risk Analysis</h2>
      </div>
      <button
        onClick={handleExport}
        disabled={isExporting || !riskData?.length}
        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:bg-gray-400"
      >
        {isExporting ? "Exporting..." : "📥 Export Report"}
      </button>
    </div>
  );
}
