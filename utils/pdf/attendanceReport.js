import jsPDF from "jspdf";
import "jspdf-autotable";

/** @type {[number,number,number]} Learnova brand purple */
const LEARNOVA_PURPLE = [139, 92, 246];

/**
 * Safely convert any value to a printable string.
 * @param {*} val
 * @param {string} [fallback="N/A"]
 * @returns {string}
 */
const safe = (val, fallback = "N/A") => {
  if (val === null || val === undefined || val === "") return fallback;
  return String(val);
};

/**
 * Render the standard Learnova PDF header block.
 * Returns the Y position immediately after the header block.
 *
 * @param {jsPDF} doc
 * @param {string} reportTitle
 * @param {Object} options
 * @returns {number} startY for content that follows
 */
const renderHeader = (doc, reportTitle, options) => {
  const {
    className = "All Classes",
    teacherName = "N/A",
    dateRange = "N/A",
    instituteName = "Learnova Institute",
    logoUrl = null,
  } = options;

  let y = 14;

  // Logo placeholder (purple square + "L")
  try {
    doc.setFillColor(...LEARNOVA_PURPLE);
    doc.rect(14, y, 12, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("L", 18.5, y + 8.5);
    doc.setTextColor(0, 0, 0);
  } catch (e) {
    console.warn("Logo rendering failed:", e);
  }

  // Institute name + tagline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(safe(instituteName), 30, y + 5);
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

  // Metadata two-column block
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.setFont("helvetica", "bold");
  doc.text("Class / Subject:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(safe(className), 46, y);

  doc.setFont("helvetica", "bold");
  doc.text("Teacher:", 14, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(safe(teacherName), 46, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Date Range:", 110, y);
  doc.setFont("helvetica", "normal");
  doc.text(safe(dateRange), 136, y);

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

// ---------------------------------------------------------------------------
// Attendance Roster PDF
// ---------------------------------------------------------------------------

/**
 * Generates a professional PDF attendance report for a class roster.
 * Supports multi-page rendering via jspdf-autotable.
 *
 * @param {Object[]} data      - Array of student attendance records
 * @param {Object}   options   - Metadata: className, teacherName, dateRange, instituteName, logoUrl, summary
 * @returns {jsPDF}             The generated jsPDF instance (also auto-saves)
 */
export const exportAttendancePDF = (data, options = {}) => {
  const doc = new jsPDF();
  let startY = renderHeader(doc, "Class Attendance Report", options);

  // Optional summary stats block
  const summary = options.summary;
  if (summary) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const parts = [];
    if (summary.totalStudents != null)
      parts.push(`Total: ${summary.totalStudents}`);
    if (summary.presentToday != null)
      parts.push(`Present: ${summary.presentToday}`);
    if (summary.absentToday != null)
      parts.push(`Absent: ${summary.absentToday}`);
    if (summary.lateToday != null) parts.push(`Late: ${summary.lateToday}`);
    if (parts.length > 0) {
      doc.text(parts.join("  ·  "), 14, startY);
      startY += 8;
    }
    doc.setTextColor(0, 0, 0);
  }

  // Table or empty state
  if (!data || data.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    doc.text(
      "No attendance data available for the selected date range.",
      14,
      startY + 6
    );
  } else {
    const body = data.map((item) => [
      safe(item.Date, new Date().toLocaleDateString()),
      safe(item.studentName || item.name),
      safe(item.rollNo || item.id),
      safe(item.status, "absent").toUpperCase(),
      safe(item.time),
      item.confidence != null ? `${item.confidence}%` : "—",
    ]);

    doc.autoTable({
      startY,
      head: [["Date", "Student Name", "Roll No", "Status", "Check-in", "Conf."]],
      body,
      theme: "grid",
      headStyles: { fillColor: LEARNOVA_PURPLE, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      // Colour-code status cells
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 3) {
          const val = (hookData.cell.raw || "").toUpperCase();
          if (val === "PRESENT")
            hookData.cell.styles.textColor = [22, 163, 74];
          else if (val === "ABSENT")
            hookData.cell.styles.textColor = [220, 38, 38];
          else if (val === "LATE")
            hookData.cell.styles.textColor = [217, 119, 6];
        }
      },
    });
  }

  const sanitizedClass = (options.className || "all")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `attendance-report-class-${sanitizedClass}-${dateStr}.pdf`;

  doc.save(filename);
  return doc;
};
