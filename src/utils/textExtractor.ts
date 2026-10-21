import * as pdfjsLib from 'pdfjs-dist';

// Polyfill Promise.try and Uint8Array.prototype.toHex if not natively present in the runtime
if (typeof (Promise as unknown as { try?: unknown }).try !== 'function') {
  (Promise as unknown as { try: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown> }).try = function (fn, ...args) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

if (!(Uint8Array.prototype as unknown as { toHex?: unknown }).toHex) {
  (Uint8Array.prototype as unknown as { toHex: () => string }).toHex = function (this: Uint8Array) {
    return Array.from(this).map((b) => b.toString(16).padStart(2, '0')).join('');
  };
}

export interface PageTextResult {
  pageNum: number;
  text: string;
  lines: string[];
}

export interface ExtractedPdfText {
  fullText: string;
  pages: PageTextResult[];
  totalPages: number;
  hasText: boolean;
}

/**
 * Extract digital text streams from PDF pages using pdfjs-dist
 */
export async function extractDigitalTextFromPdf(
  pdfBytes: Uint8Array,
  password?: string
): Promise<ExtractedPdfText> {
  const bufferCopy = pdfBytes.slice(0).buffer;
  const loadingTask = pdfjsLib.getDocument({
    data: bufferCopy,
    password: password || undefined,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pages: PageTextResult[] = [];
  const fullTextParts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();

    // Group text items by approximate vertical position (Y coordinate)
    const items = content.items as { str: string; transform: number[] }[];
    const lineMap: Map<number, { x: number; text: string }[]> = new Map();

    for (const item of items) {
      if (!item.str || item.str.trim() === '') continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);

      // Find bucket within 4 points
      let matchedY = y;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 4) {
          matchedY = existingY;
          break;
        }
      }

      if (!lineMap.has(matchedY)) {
        lineMap.set(matchedY, []);
      }
      lineMap.get(matchedY)!.push({ x, text: item.str });
    }

    // Sort lines by Y descending (top to bottom)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines: string[] = [];

    for (const y of sortedY) {
      const lineItems = lineMap.get(y)!;
      // Sort items by X ascending (left to right)
      lineItems.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map((it) => it.text).join(' ');
      if (lineText.trim()) {
        pageLines.push(lineText);
      }
    }

    const pageText = pageLines.join('\n');
    pages.push({
      pageNum: i,
      text: pageText,
      lines: pageLines,
    });

    if (pageText) {
      fullTextParts.push(`--- Page ${i} ---\n${pageText}`);
    }
  }

  const fullText = fullTextParts.join('\n\n');
  return {
    fullText,
    pages,
    totalPages,
    hasText: fullText.trim().length > 0,
  };
}
