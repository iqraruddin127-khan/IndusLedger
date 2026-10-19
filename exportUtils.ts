// ─── Shared utilities for CSV parsing and document export ────────────────

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = false;
        } else current += char;
      } else if (char === '"') inQuotes = true;
      else if (char === ',') { fields.push(current.trim()); current = ''; }
      else current += char;
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => { row[header] = values[i] ?? ''; });
    return row;
  });
  return { headers, rows };
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Excel export (SpreadsheetML 2003 — opens natively in Excel) ─────────

export function downloadExcel(
  sheets: { name: string; headers: string[]; rows: (string | number)[][] }[],
  filename: string
): void {
  const esc = (v: unknown) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sheetXml = sheets.map((sheet) => {
    const headerCells = sheet.headers.map((h) => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('');
    const bodyRows = sheet.rows.map((row) =>
      `<Row>${row.map((cell) => {
        const isNumber = typeof cell === 'number' && Number.isFinite(cell);
        return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${esc(cell)}</Data></Cell>`;
      }).join('')}</Row>`
    ).join('');
    return `<Worksheet ss:Name="${esc(sheet.name).slice(0, 31)}"><Table><Row>${headerCells}</Row>${bodyRows}</Table></Worksheet>`;
  }).join('');

  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="hdr"><Font ss:Bold="1"/><Interior ss:Color="#0d9488" ss:Pattern="Solid"/></Style></Styles>
${sheetXml}
</Workbook>`;
  downloadFile(xml, filename, 'application/vnd.ms-excel');
}

// ─── PDF export (self-contained: opens in any viewer, prints to PDF) ─────

export interface PdfSection {
  heading: string;
  lines: string[];
}

export function downloadPdfReport(
  title: string,
  subtitle: string,
  sections: PdfSection[],
  filename: string
): void {
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sectionHtml = sections.map((section) => `
    <h2>${esc(section.heading)}</h2>
    <table>
      ${section.lines.map((line) => {
        const [label, ...rest] = line.split(':');
        const value = rest.join(':').trim();
        return `<tr><td class="label">${esc(label)}</td><td class="value">${esc(value)}</td></tr>`;
      }).join('')}
    </table>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { margin: 22mm 18mm; }
  body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; }
  header { border-bottom: 3px solid #0d9488; padding-bottom: 14px; margin-bottom: 24px; }
  h1 { font-size: 21px; margin: 0 0 4px; color: #0f766e; }
  .subtitle { font-size: 12px; color: #64748b; margin: 0; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #0f766e;
       border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td { font-size: 11.5px; padding: 4.5px 6px; border-bottom: 1px solid #f1f5f9; }
  td.label { color: #475569; width: 62%; }
  td.value { font-weight: 600; text-align: right; }
  .print-hint { margin-top: 26px; font-size: 10.5px; color: #94a3b8; text-align: center; }
  footer { margin-top: 30px; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  @media print { .print-hint { display: none; } }
</style>
</head>
<body>
<header>
  <h1>${esc(title)}</h1>
  <p class="subtitle">${esc(subtitle)}</p>
</header>
${sectionHtml}
<p class="print-hint">Use your browser's Print dialog and choose "Save as PDF" for a permanent copy.</p>
<footer>Generated by IndusLedger AI on ${esc(new Date().toLocaleString())} · Figures are demo/sample estimates and require verification before financial or compliance use.</footer>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 350); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    // Popup blocked — fall back to a direct file download
    downloadFile(html, filename.replace(/\.pdf$/, '.html'), 'text/html');
  }
}
