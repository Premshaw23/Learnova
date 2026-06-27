import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Format a raw date value (ISO string, timestamp number, or Date) into a
 * human-readable string like "Jan 15, 2025". Returns a fallback string when
 * the value is falsy or cannot be parsed.
 *
 * @param {string|number|Date|null|undefined} value
 * @param {string} [fallback="—"]
 * @returns {string}
 */
export const formatDateReadable = (value, fallback = "—") => {
  if (!value) return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
};

/**
 * Safely convert a value to string, replacing null/undefined/empty with a
 * human-readable em-dash so exports are never blank.
 *
 * @param {*} value
 * @param {string} [fallback="—"]
 * @returns {string}
 */
export const safeStr = (value, fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

/**
 * Trigger a file download in the browser.
 * @param {Blob} blob
 * @param {string} filename
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Generic CSV export (existing behaviour preserved)
// ---------------------------------------------------------------------------

/**
 * Export any array of plain objects as a CSV file.
 * Uses papaparse to safely handle commas / quotes in values.
 *
 * @param {Object[]} data
 * @param {string}   filename  — without extension
 */
export const exportToCSV = (data, filename) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    downloadBlob(blob, `${filename}.csv`);
  }
};

// ---------------------------------------------------------------------------
// Generic PDF export (existing behaviour preserved)
// ---------------------------------------------------------------------------

/**
 * Export any dataset as a simple PDF table.
 *
 * @param {Object[]} data
 * @param {{ header: string; dataKey: string }[]} columns
 * @param {string} title
 * @param {string} filename — without extension
 */
export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    14,
    30
  );

  doc.autoTable({
    startY: 40,
    head: [columns.map((col) => col.header)],
    body: data.map((item) => columns.map((col) => safeStr(item[col.dataKey]))),
    theme: "grid",
    headStyles: { fillColor: [139, 92, 246] }, // Learnova purple
    styles: { fontSize: 10 },
  });

  doc.save(`${filename}.pdf`);
};

// ---------------------------------------------------------------------------
// Teacher Attendance Report — CSV
// ---------------------------------------------------------------------------

/**
 * Export today's attendance roster as a structured CSV.
 *
 * Expected shape of each item in `studentData`:
 *   { name, rollNo, status, time, confidence, date? }
 *
 * @param {Object[]} studentData       — raw roster from useAttendance hook
 * @param {Object}   [meta={}]
 * @param {string}   [meta.className]  — e.g. "CS-4A / Data Structures"
 * @param {string}   [meta.dateRange]  — e.g. "Today" or "2025-06-01 – 2025-06-09"
 * @param {string}   [meta.teacherName]
 */
export const exportAttendanceCSV = (studentData, meta = {}) => {
  const {
    className = "All Classes",
    dateRange = new Date().toLocaleDateString(),
    teacherName = "N/A",
  } = meta;

  if (!studentData || studentData.length === 0) {
    // Export an empty file with headers so the teacher still gets a usable file
    const emptyRows = [
      {
        "Class Name": className,
        "Date Range": dateRange,
        "Student Name": "—",
        "Roll No": "—",
        Date: dateRange,
        Status: "—",
        "Check-in Time": "—",
        "Confidence Score": "—",
        "Attendance %": "—",
      },
    ];
    const csv = Papa.unparse(emptyRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(
      blob,
      `attendance-report-${className.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    return;
  }

  const rows = studentData.map((student) => ({
    "Class Name": safeStr(className),
    "Date Range": safeStr(dateRange),
    "Student Name": safeStr(student.name),
    "Roll No": safeStr(student.rollNo),
    Date: formatDateReadable(student.date) !== "—"
      ? formatDateReadable(student.date)
      : safeStr(dateRange),
    Status: safeStr(student.status, "absent").toUpperCase(),
    "Check-in Time": safeStr(student.time),
    "Confidence Score":
      student.confidence != null ? `${student.confidence}%` : "—",
    "Attendance %":
      student.attendancePercentage != null
        ? `${student.attendancePercentage}%`
        : "—",
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const sanitizedClass = className.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `attendance-report-${sanitizedClass}-${dateStr}.csv`);
};

// ---------------------------------------------------------------------------
// Teacher Analytics Report — CSV
// ---------------------------------------------------------------------------

/**
 * Export the analytics risk overview (from /api/analytics/attendance-risk)
 * as a CSV. Each row is one student with all available metrics.
 *
 * Expected shape of each item in `students`:
 *   { studentName, email, attendanceRate, totalDays, presentDays,
 *     trend, riskLevel, riskScore }
 *
 * @param {Object[]} students
 * @param {Object}   [meta={}]
 * @param {string}   [meta.className]
 * @param {string}   [meta.dateRange]
 * @param {string}   [meta.teacherName]
 */
export const exportAnalyticsCSV = (students, meta = {}) => {
  const {
    className = "All Classes",
    dateRange = "Last 28 days",
    teacherName = "N/A",
  } = meta;

  if (!students || students.length === 0) {
    const emptyRows = [
      {
        "Class Name": className,
        "Date Range": dateRange,
        Teacher: teacherName,
        "Student Name": "—",
        Email: "—",
        "Attendance %": "—",
        "Days Present": "—",
        "Total Days": "—",
        Trend: "—",
        "Risk Level": "—",
        "Risk Score": "—",
        "Report Generated": new Date().toLocaleString(),
      },
    ];
    const csv = Papa.unparse(emptyRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(
      blob,
      `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    return;
  }

  const rows = students.map((s) => ({
    "Class Name": safeStr(className),
    "Date Range": safeStr(dateRange),
    Teacher: safeStr(teacherName),
    "Student Name": safeStr(s.studentName),
    Email: safeStr(s.email),
    "Attendance %":
      s.attendanceRate != null ? `${s.attendanceRate}%` : "—",
    "Days Present": safeStr(s.presentDays),
    "Total Days": safeStr(s.totalDays),
    Trend: safeStr(s.trend),
    "Risk Level": safeStr(s.riskLevel)
      .replace("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    "Risk Score": s.riskScore != null ? s.riskScore : "—",
    "Report Generated": new Date().toLocaleString(),
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `analytics-attendance-risk-${dateStr}.csv`);
};

// ---------------------------------------------------------------------------
// Teacher Analytics Report — PDF
// ---------------------------------------------------------------------------

/** @type {[number,number,number]} Learnova brand purple */
const LEARNOVA_PURPLE = [139, 92, 246];

/**
 * Render the standard Learnova PDF report header and return the Y position
 * after the header for the caller to start their content.
 *
 * @param {jsPDF} doc
 * @param {string} reportTitle       — e.g. "Attendance Analytics Report"
 * @param {Object} meta
 * @param {string} meta.className
 * @param {string} meta.teacherName
 * @param {string} meta.dateRange
 * @param {string} meta.instituteName
 * @returns {number} startY — Y coordinate for the first content block
 */
const renderPDFHeader = (doc, reportTitle, meta) => {
  const {
    className = "All Classes",
    teacherName = "N/A",
    dateRange = "N/A",
    instituteName = "Learnova Institute",
  } = meta;

  let y = 14;

  // Learnova logo placeholder box
  doc.setFillColor(...LEARNOVA_PURPLE);
  doc.rect(14, y, 12, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("L", 18.5, y + 8.5);
  doc.setTextColor(0, 0, 0);

  // Institute name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(instituteName, 30, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("AI-Powered Smart Student Engagement & Attendance", 30, y + 10);
  doc.setTextColor(0, 0, 0);

  y += 18;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 8;

  // Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(reportTitle, 14, y);
  y += 10;

  // Metadata — two-column layout
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.setFont("helvetica", "bold");
  doc.text("Class / Subject:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(safeStr(className), 46, y);

  doc.setFont("helvetica", "bold");
  doc.text("Teacher:", 14, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(safeStr(teacherName), 46, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Date Range:", 110, y);
  doc.setFont("helvetica", "normal");
  doc.text(safeStr(dateRange), 136, y);

  doc.setFont("helvetica", "bold");
  doc.text("Generated On:", 110, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    136,
    y + 6
  );

  doc.setTextColor(0, 0, 0);
  y += 18;

  return y;
};

/**
 * Export the analytics risk overview as a multi-page PDF report.
 *
 * @param {Object[]} students
 * @param {Object}   [meta={}]
 * @param {string}   [meta.className]
 * @param {string}   [meta.teacherName]
 * @param {string}   [meta.dateRange]
 * @param {string}   [meta.instituteName]
 * @param {Object}   [summary={}]         — aggregated totals shown above the table
 * @param {number}   [summary.totalStudents]
 * @param {number}   [summary.atRiskCount]
 * @param {number}   [summary.warningCount]
 */
export const exportAnalyticsPDF = (students, meta = {}, summary = {}) => {
  const doc = new jsPDF();
  const startY = renderPDFHeader(doc, "Attendance Analytics Report", meta);

  // Summary block
  let y = startY;
  if (
    summary.totalStudents != null ||
    summary.atRiskCount != null ||
    summary.warningCount != null
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Summary: ${safeStr(summary.totalStudents, "?")} students total · ` +
        `${safeStr(summary.atRiskCount, "?")} at risk · ` +
        `${safeStr(summary.warningCount, "?")} warning`,
      14,
      y
    );
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  // Table
  if (!students || students.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    doc.text("No analytics data available for the selected period.", 14, y + 6);
  } else {
    doc.autoTable({
      startY: y,
      head: [
        [
          "Student Name",
          "Email",
          "Attendance %",
          "Days Present",
          "Total Days",
          "Trend",
          "Risk Level",
        ],
      ],
      body: students.map((s) => [
        safeStr(s.studentName),
        safeStr(s.email),
        s.attendanceRate != null ? `${s.attendanceRate}%` : "—",
        safeStr(s.presentDays),
        safeStr(s.totalDays),
        safeStr(s.trend),
        safeStr(s.riskLevel)
          .replace("_", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      ]),
      theme: "grid",
      headStyles: { fillColor: LEARNOVA_PURPLE, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      // Colour-code risk level cells
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 6) {
          const val = (hookData.cell.raw || "").toLowerCase();
          if (val.includes("at risk")) {
            hookData.cell.styles.textColor = [220, 38, 38]; // red-600
            hookData.cell.styles.fontStyle = "bold";
          } else if (val.includes("warning")) {
            hookData.cell.styles.textColor = [217, 119, 6]; // amber-600
            hookData.cell.styles.fontStyle = "bold";
          } else {
            hookData.cell.styles.textColor = [22, 163, 74]; // green-600
          }
        }
      },
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`analytics-attendance-risk-${dateStr}.pdf`);
};
