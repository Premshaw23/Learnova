import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// AFTER (fixed)
export const exportToCSV = (data, filename) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Release the Blob URL from memory immediately
  }
};

export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
  
  // Table
  doc.autoTable({
    startY: 40,
    head: [columns.map(col => col.header)],
    body: data.map(item => columns.map(col => item[col.dataKey])),
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] }, // Purple-ish to match UI
    styles: { fontSize: 10 },
  });
  
  doc.save(`${filename}.pdf`);
};
