import jsPDF from "jspdf";

/**
 * Generates a professional, high-fidelity PDF certificate for course completion.
 * Renders in landscape orientation with elegant borders, branding, typography,
 * custom vector signatures, and a gold seal.
 *
 * @param {Object} params
 * @param {string} params.studentName - Name of the student
 * @param {string} params.courseTitle - Title of the course completed
 * @param {string} params.completionDate - Formatted completion date
 * @param {string} params.instructorName - Instructor of the course
 * @returns {string} The generated filename
 */
export const generateCertificatePDF = ({
  studentName = "Learnova Student",
  courseTitle = "Advanced Course",
  completionDate = new Date().toLocaleDateString(),
  instructorName = "Learnova Faculty",
}) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth(); // A4 width: 297mm
  const height = doc.internal.pageSize.getHeight(); // A4 height: 210mm

  // 1. Draw elegant outer double border
  // Outer Border (Gold)
  doc.setDrawColor(212, 175, 55); // Gold: #d4af37
  doc.setLineWidth(1.5);
  doc.rect(10, 10, width - 20, height - 20);

  // Inner Border (Deep Indigo/Purple)
  doc.setDrawColor(99, 102, 241); // Indigo: #6366f1
  doc.setLineWidth(0.5);
  doc.rect(12, 12, width - 24, height - 24);

  // Corner ornaments (gold triangles/shapes)
  // Top-left
  doc.setFillColor(212, 175, 55);
  doc.triangle(12, 12, 22, 12, 12, 22, "FD");
  // Top-right
  doc.triangle(width - 12, 12, width - 22, 12, width - 12, 22, "FD");
  // Bottom-left
  doc.triangle(12, height - 12, 22, height - 12, 12, height - 22, "FD");
  // Bottom-right
  doc.triangle(
    width - 12,
    height - 12,
    width - 22,
    height - 12,
    width - 12,
    height - 22,
    "FD"
  );

  // 2. Header Branding
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(99, 102, 241); // Indigo
  doc.text("L E A R N O V A   A C A D E M Y", width / 2, 30, {
    align: "center",
  });

  // Elegant Divider Line
  doc.setDrawColor(228, 228, 231); // Gray-200
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 40, 35, width / 2 + 40, 35);

  // 3. Certificate Subheading
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.setTextColor(113, 113, 122); // Zinc-500
  doc.text("This certificate is proudly presented to", width / 2, 52, {
    align: "center",
  });

  // 4. Student Name
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(24, 24, 27); // Zinc-900
  doc.text(studentName, width / 2, 70, { align: "center" });

  // Gold underline under the student's name
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - 50, 75, width / 2 + 50, 75);

  // 5. Completion Description
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(113, 113, 122); // Zinc-500
  doc.text(
    "for successfully completing the advanced curriculum and requirements of",
    width / 2,
    88,
    { align: "center" }
  );

  // 6. Course Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Deep Indigo
  doc.text(courseTitle, width / 2, 105, { align: "center" });

  // 7. Date of Completion
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(82, 82, 91); // Zinc-600
  doc.text(`Completed on ${completionDate}`, width / 2, 120, {
    align: "center",
  });

  // 8. Unique Certificate Hash
  const cleanTitle = courseTitle
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 3)
    .toUpperCase();
  const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
  const hash = `LN-${cleanTitle}-${randomHash}`;

  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170); // Zinc-400
  doc.text(`Verification ID: ${hash}`, width / 2, 130, { align: "center" });

  // 9. Signatures Block
  const sigY = 165;

  // Left: Instructor
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(113, 113, 122);
  doc.text("INSTRUCTOR", 60, sigY + 10, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(39, 39, 42);
  doc.text(instructorName, 60, sigY + 5, { align: "center" });
  doc.setDrawColor(161, 161, 170);
  doc.setLineWidth(0.5);
  doc.line(35, sigY, 85, sigY);

  // Vector Signature Squiggle for Instructor (Bezier curves)
  doc.setDrawColor(79, 70, 229); // Blue/Indigo ink
  doc.setLineWidth(0.75);
  doc.moveTo(40, sigY - 8);
  doc.bezierCurveTo(45, sigY - 14, 52, sigY - 2, 58, sigY - 7);
  doc.bezierCurveTo(64, sigY - 12, 70, sigY - 4, 76, sigY - 9);
  doc.bezierCurveTo(80, sigY - 11, 82, sigY - 6, 84, sigY - 8);
  doc.stroke();

  // Right: Director
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(113, 113, 122);
  doc.text("DIRECTOR", width - 60, sigY + 10, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(39, 39, 42);
  doc.text("Prem Shaw", width - 60, sigY + 5, { align: "center" });
  doc.setDrawColor(161, 161, 170);
  doc.setLineWidth(0.5);
  doc.line(width - 85, sigY, width - 35, sigY);

  // Vector Signature Squiggle for Director
  doc.setDrawColor(79, 70, 229); // Blue/Indigo ink
  doc.setLineWidth(0.75);
  doc.moveTo(width - 80, sigY - 6);
  doc.bezierCurveTo(
    width - 74,
    sigY - 12,
    width - 68,
    sigY - 1,
    width - 62,
    sigY - 8
  );
  doc.bezierCurveTo(
    width - 56,
    sigY - 15,
    width - 50,
    sigY - 3,
    width - 44,
    sigY - 10
  );
  doc.bezierCurveTo(
    width - 40,
    sigY - 12,
    width - 38,
    sigY - 7,
    width - 36,
    sigY - 9
  );
  doc.stroke();

  // 10. Golden Seal / Badge (Bottom Center)
  const sealX = width / 2;
  const sealY = 162;

  // Starburst points (outer rays of seal)
  doc.setFillColor(212, 175, 55); // Gold
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.2);

  const numPoints = 16;
  const outerRadius = 14;
  const innerRadius = 11;
  const points = [];

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    points.push([sealX + Math.cos(angle) * r, sealY + Math.sin(angle) * r]);
  }

  // Draw starburst polygon
  doc.polygon(points, "FD");

  // Inner circle
  doc.setFillColor(255, 255, 255);
  doc.circle(sealX, sealY, 9, "F");

  // Seal text / detail
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(212, 175, 55);
  doc.text("L E A R N O V A", sealX, sealY - 1.5, { align: "center" });
  doc.text("APPROVED", sealX, sealY + 1.5, { align: "center" });

  // Little gold star in seal
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.text("★", sealX, sealY + 4.5, { align: "center" });

  // Save the PDF
  const filename = `certificate-${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  doc.save(filename);

  return filename;
};
