import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font: ${url}`);
  return res.arrayBuffer();
}

/**
 * Export data to CSV file with proper Vietnamese encoding
 */
export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
) {
  if (data.length === 0) return;

  const header = columns.map(c => escapeCSV(c.header)).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      return escapeCSV(String(val));
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(filename)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to Excel (.xlsx) file
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string,
  sheetName = 'Sheet1'
) {
  if (data.length === 0) return;

  const wsData = [
    columns.map(c => c.header),
    ...data.map(row =>
      columns.map(c => {
        const val = row[c.key];
        if (val === null || val === undefined) return '';
        return val;
      })
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const colWidths = columns.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${sanitizeFilename(filename)}.xlsx`);
}

/**
 * Open Google Sheets with pre-filled data
 */
export function openGoogleSheets<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
) {
  if (data.length === 0) return;

  const csvContent = [
    columns.map(c => escapeCSV(c.header)).join(','),
    ...data.map(row =>
      columns.map(c => {
        const val = row[c.key];
        if (val === null || val === undefined) return '';
        return escapeCSV(String(val));
      }).join(',')
    ),
  ].join('\n');

  const encoded = btoa(unescape(encodeURIComponent(csvContent)));
  const url =
    `https://docs.google.com/spreadsheets/export?format=csv&filename=${encodeURIComponent(filename)}&data=${encoded}`;

  window.open(url, '_blank');
}

/**
 * Export data to PDF file (Vietnamese supported via Noto Sans font)
 */
export async function exportToPdf<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string,
  options?: {
    title?: string;
    orientation?: 'portrait' | 'landscape';
    fontSize?: number;
  }
) {
  if (data.length === 0) return;

  const doc = new jsPDF({
    orientation: options?.orientation ?? 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const title = options?.title ?? filename;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Register Noto Sans fonts for Vietnamese support
  let fontFamily = 'helvetica';
  try {
    const [regularBuffer, boldBuffer] = await Promise.all([
      loadFont('/NotoSans-Regular.ttf'),
      loadFont('/NotoSans-Bold.ttf'),
    ]);
    // addFont(ttfBuffer, fontName, fontFamily, fontWeight)
    doc.addFont(regularBuffer as unknown as string, 'NotoSans', 'noto', 'normal');
    doc.addFont(boldBuffer as unknown as string, 'NotoSans', 'noto', 'bold');
    fontFamily = 'noto';
  } catch (e) {
    console.warn('Không tải được font Noto Sans, dùng Helvetica:', e);
  }

  // Title
  doc.setFontSize(options?.fontSize ?? 14);
  doc.setFont(fontFamily, 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });

  // Date + summary
  doc.setFontSize(8);
  doc.setFont(fontFamily, 'normal');
  const dateStr = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  const totalStr = `Tổng: ${data.length.toLocaleString('vi-VN')} dòng`;
  doc.text(dateStr, pageWidth / 2, 21, { align: 'center' });
  doc.text(totalStr, pageWidth / 2, 26, { align: 'center' });

  // Table
  const head = [columns.map(c => c.header)];
  const body = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'number') return val.toLocaleString('vi-VN');
      return String(val);
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 10, right: 10 },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
    didDrawPage: (hookData) => {
      const str = `Trang ${hookData.pageNumber} / ${doc.getNumberOfPages()}`;
      doc.setFontSize(7);
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(str, pageWidth / 2, pageHeight - 5, { align: 'center' });
    },
  });

  doc.save(`${sanitizeFilename(filename)}.pdf`);
}

/**
 * Print current page
 */
export function printPage() {
  window.print();
}

// --- Utilities ---

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
}