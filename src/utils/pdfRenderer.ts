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

// Configure worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    const version = pdfjsLib.version || '4.0.379';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

/**
 * Render a single PDF page to an HTMLCanvasElement
 */
export async function renderPdfPageToCanvas(
  pdfData: Uint8Array,
  pageNumber: number,
  scale = 1.0
): Promise<HTMLCanvasElement> {
  // Use a copy of the buffer so pdfjs doesn't detach/transfer original ArrayBuffer
  const bufferCopy = pdfData.slice(0).buffer;
  const loadingTask = pdfjsLib.getDocument({ data: bufferCopy });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error('Failed to acquire 2D canvas context');
  }

  // Draw white background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas,
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas;
}

/**
 * Generate a compact data URL thumbnail for a given page
 */
export async function renderPdfThumbnail(
  pdfData: Uint8Array,
  pageNumber: number,
  maxWidth = 200
): Promise<string> {
  try {
    const bufferCopy = pdfData.slice(0).buffer;
    const loadingTask = pdfjsLib.getDocument({ data: bufferCopy });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(pageNumber);

    const initialViewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(maxWidth / initialViewport.width, 1.2);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (!context) return createFallbackThumbnail(pageNumber);

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn(`Could not render thumbnail for page ${pageNumber}:`, err);
    return createFallbackThumbnail(pageNumber);
  }
}

/**
 * Render all page thumbnails in parallel/batches
 */
export async function renderAllThumbnails(
  pdfData: Uint8Array,
  pageCount: number,
  onProgress?: (rendered: number, total: number) => void
): Promise<string[]> {
  const thumbnails: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const thumb = await renderPdfThumbnail(pdfData, i, 220);
    thumbnails.push(thumb);
    if (onProgress) onProgress(i, pageCount);
  }
  return thumbnails;
}

/**
 * Get accurate page count
 */
export async function getPdfPageCount(pdfData: Uint8Array): Promise<number> {
  const bufferCopy = pdfData.slice(0).buffer;
  const loadingTask = pdfjsLib.getDocument({ data: bufferCopy });
  const pdfDoc = await loadingTask.promise;
  return pdfDoc.numPages;
}

/**
 * Fallback visual thumbnail generator if canvas rendering encounters protected/exotic page
 */
export function createFallbackThumbnail(pageNumber: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 226; // Approx A4 ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 160, 226);

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 160, 226);

  // Decorative lines simulating text
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(20, 25, 60, 8);
  ctx.fillRect(20, 42, 120, 4);
  ctx.fillRect(20, 52, 110, 4);
  ctx.fillRect(20, 62, 115, 4);
  ctx.fillRect(20, 72, 80, 4);

  ctx.fillRect(20, 95, 120, 4);
  ctx.fillRect(20, 105, 115, 4);
  ctx.fillRect(20, 115, 90, 4);

  // Page number badge
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Page ${pageNumber}`, 80, 180);

  return canvas.toDataURL('image/png');
}
