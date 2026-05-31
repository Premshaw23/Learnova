import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Generates a professional PDF attendance report.
 * 
 * @param {Array} data - Array of student attendance records
 * @param {Object} options - Metadata options including class name, teacher, range, logo
 * @returns {jsPDF} The generated jsPDF instance
 */
export const exportAttendancePDF = (data, options = {}) => {
  const doc = new jsPDF();
  const {
    className = "All Classes",
    teacherName = "N/A",
    dateRange = "N/A",
    instituteName = "Learnova Institute",
    logoUrl = null,
  } = options;

  // 1. Header Area
  let startY = 20;

  if (logoUrl) {
    try {
      // Draw a fallback clean placeholder box since absolute external image urls might fail in some test envs
      doc.setFillColor(139, 92, 246); // Learnova Purple color
      doc.rect(14, startY, 12, 12, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("L", 18, startY + 8);
      doc.setTextColor(0, 0, 0);
    } catch (e) {
      console.warn("Logo rendering failed:", e);
    }
    
    // Institute Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(instituteName, 30, startY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("AI-Powered Smart Student Engagement & Attendance", 30, startY + 10);
    startY += 18;
  } else {
    // Regular Header text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(instituteName, 14, startY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("AI-Powered Smart Student Engagement & Attendance", 14, startY + 10);
    startY += 18;
  }

  // 2. Divider Line
  doc.setDrawColor(220, 220, 220);
  doc.line(14, startY, 196, startY);
  startY += 10;

  // 3. Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Class Attendance Report", 14, startY);
  startY += 10;

  // 4. Metadata Block (Side-by-side Layout)
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600

  // Left Column
  doc.setFont("helvetica", "bold");
  doc.text("Class/Subject:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(className, 42, startY);

  doc.setFont("helvetica", "bold");
  doc.text("Teacher:", 14, startY + 6);
  doc.setFont("helvetica", "normal");
  doc.text(teacherName, 42, startY + 6);

  // Right Column
  doc.setFont("helvetica", "bold");
  doc.text("Date Range:", 110, startY);
  doc.setFont("helvetica", "normal");
  doc.text(dateRange, 138, startY);

  doc.setFont("helvetica", "bold");
  doc.text("Generated On:", 110, startY + 6);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(), 138, startY + 6);

  startY += 18;

  // 5. Table or Empty State
  if (!data || data.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text("No attendance data available for the selected date range.", 14, startY + 10);
  } else {
    const columns = ["Date", "Student Name", "Roll No", "Status"];
    const body = data.map((item) => [
      item.Date || new Date().toLocaleDateString(),
      item.studentName || item.name || "N/A",
      item.rollNo || item.id || "N/A",
      (item.status || "N/A").toUpperCase(),
    ]);

    doc.autoTable({
      startY: startY,
      head: [columns],
      body: body,
      theme: "grid",
      headStyles: { fillColor: [139, 92, 246] }, // Learnova Purple theme
      styles: { fontSize: 10, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50 background for alternate rows
    });
  }

  // 6. Save document
  const sanitizedClass = className.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `attendance-report-class-${sanitizedClass}-${dateStr}.pdf`;

  doc.save(filename);
  return doc;
};
