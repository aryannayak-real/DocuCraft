import * as XLSX from 'xlsx';
import { PageTextResult } from './textExtractor';

export interface SpreadsheetExportResult {
  xlsxBlob: Blob;
  csvString: string;
  previewRows: string[][];
  totalRows: number;
}

/**
 * Detect tabular rows from PDF lines and export as XLSX and CSV
 */
export function extractTablesToSpreadsheet(
  pages: PageTextResult[]
): SpreadsheetExportResult {
  const allRows: string[][] = [];

  for (const page of pages) {
    for (const line of page.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let cells: string[] = [];

      if (trimmed.includes('\t')) {
        cells = trimmed.split('\t').map((c) => c.trim());
      } else if (trimmed.includes('|')) {
        cells = trimmed
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean);
      } else if (trimmed.includes(';') && (trimmed.match(/;/g) || []).length >= 2) {
        cells = trimmed.split(';').map((c) => c.trim());
      } else {
        // Split on multiple consecutive spaces (2 or more spaces usually delineate columns)
        const spaceParts = trimmed.split(/\s{2,}/).map((c) => c.trim());
        if (spaceParts.length > 1) {
          cells = spaceParts;
        } else {
          // Fallback single column line
          cells = [trimmed];
        }
      }

      if (cells.length > 0) {
        allRows.push([`Page ${page.pageNum}`, ...cells]);
      }
    }
  }

  // Fallback if document has empty text
  if (allRows.length === 0) {
    allRows.push(['Page', 'Extracted Content'], ['1', 'No structured tabular data detected']);
  }

  // Create XLSX workbook
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');

  const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const xlsxBlob = new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const csvString = XLSX.utils.sheet_to_csv(worksheet);

  return {
    xlsxBlob,
    csvString,
    previewRows: allRows.slice(0, 15), // Preview first 15 rows
    totalRows: allRows.length,
  };
}
