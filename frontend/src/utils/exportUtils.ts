import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (data: any[], filename: string, title: string) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); 
  doc.text(title, 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); 
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

  const headers = Object.keys(data[0] || {}).map(key => key);
  const rows = data.map(item => Object.values(item).map(val => String(val)));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    theme: 'striped',
    headStyles: { 
      fillColor: [99, 102, 241], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }, 
    margin: { top: 40 }
  });

  doc.save(`${filename}.pdf`);
};

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};