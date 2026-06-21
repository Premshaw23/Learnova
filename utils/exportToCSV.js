export const exportRiskToCSV = (data) => {
  if (!data || !data.length) return;
  const headers = [
    "Student ID",
    "Risk Level",
    "Primary Triggers",
    "Early Warning Notes",
    "Generated At",
  ];
  const rows = data.map((item) => [
    `"${item.studentId || ""}"`,
    `"${item.riskLevel || "Low"}"`,
    `"${Array.isArray(item.primaryTriggers) ? item.primaryTriggers.join(", ") : item.primaryTriggers || ""}"`,
    `"${item.earlyWarningNotes?.replace(/"/g, '""') || ""}"`,
    `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}"`,
  ]);
  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join(
    "\n"
  );
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `AI_Attendance_Risk_Report_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); //  Release Blob from memory immediately
};
