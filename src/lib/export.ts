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
  const bom = '\uFEFF'; // UTF-8 BOM for Vietnamese
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

function escapeCSV(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes
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

/**
 * Print current page
 */
export function printPage() {
  window.print();
}
