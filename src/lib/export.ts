import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

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
  ws['!cols'] = columns.map(() => ({ wch: 20 }));

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
 * Export data to PDF using html2canvas (full Vietnamese font support)
 * Renders the table as HTML → canvas (browser font rendering) → PDF
 */
export async function exportToPdf<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string,
  options?: {
    title?: string;
    orientation?: 'portrait' | 'landscape';
  }
) {
  if (data.length === 0) return;

  // Build HTML table for rendering
  const title = options?.title ?? filename;
  const html = buildTableHtml(data, columns, title);

  // Create hidden container
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1200px;z-index:-1;background:#fff;font-family:Noto Sans,Segoe UI,Arial,sans-serif;';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait for fonts to render
  await document.fonts.ready;

  // Use html2canvas to capture the HTML at high resolution
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: container.offsetWidth,
    height: container.offsetHeight,
  });

  document.body.removeChild(container);

  // Calculate PDF dimensions (A4 in mm)
  const isLandscape = options?.orientation === 'landscape';
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 10;

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const doc = new jsPDF({
    orientation: options?.orientation ?? 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  if (imgHeight <= pageHeight - margin * 2) {
    // Single page
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, imgHeight);
  } else {
    // Multi-page: split canvas into pages
    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d')!;
    const pxPerPage = Math.floor((canvas.width / imgWidth) * (pageHeight - margin * 2));
    let yOffset = 0;
    let pageNum = 1;

    while (yOffset < canvas.height) {
      const sliceHeight = Math.min(pxPerPage, canvas.height - yOffset);
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      pageCtx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
      if (pageNum > 1) doc.addPage();

      doc.addImage(
        pageCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        margin,
        imgWidth,
        sliceImgHeight
      );

      // Page number footer
      const totalPages = Math.ceil(canvas.height / pxPerPage);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Trang ${pageNum} / ${totalPages}`,
        pageWidth / 2,
        pageHeight - 4,
        { align: 'center' }
      );

      yOffset += pxPerPage;
      pageNum++;
    }
  }

  doc.save(`${sanitizeFilename(filename)}.pdf`);
}

function buildTableHtml<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  title: string
): string {
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const totalStr = data.length.toLocaleString('vi-VN');

  const headerRow = columns.map(c => `<th>${escapeHtml(c.header)}</th>`).join('');
  const dataRows = data.map(row =>
    '<tr>' +
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '<td></td>';
      if (typeof val === 'number') return `<td style="text-align:right">${val.toLocaleString('vi-VN')}</td>`;
      return `<td>${escapeHtml(String(val))}</td>`;
    }).join('') +
    '</tr>'
  ).join('');

  return `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Noto Sans, Arial, sans-serif; font-size: 12px; color: #111; padding: 16px; }
  .title { font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 4px; }
  .meta { font-size: 10px; color: #666; text-align: center; margin-bottom: 4px; }
  .meta span { margin: 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  th { background: #2563eb; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  tr:hover td { background: #eff6ff; }
  .footer { font-size: 9px; color: #999; text-align: center; margin-top: 8px; }
</style>
<div class="title">${escapeHtml(title)}</div>
<div class="meta">
  <span>Ngày xuất: ${dateStr}</span>
  <span>·</span>
  <span>Tổng: ${totalStr} dòng</span>
</div>
<table>
  <thead><tr>${headerRow}</tr></thead>
  <tbody>${dataRows}</tbody>
</table>
<div class="footer">Xuất từ TTStock · erp.mte.vn</div>
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
