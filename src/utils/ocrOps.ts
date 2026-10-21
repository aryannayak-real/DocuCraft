import { createWorker } from 'tesseract.js';

export interface OcrProgressUpdate {
  status: string;
  progress: number; // 0 to 1
}

/**
 * Perform client-side OCR on a canvas or image data URL using Tesseract.js
 */
export async function runClientOcr(
  imageSource: HTMLCanvasElement | string,
  language = 'eng',
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<string> {
  const worker = await createWorker(language, 1, {
    logger: m => {
      if (onProgress && typeof m.progress === 'number') {
        onProgress({
          status: m.status || 'Processing',
          progress: m.progress,
        });
      }
    },
  });

  try {
    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    return ret.data.text || '';
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}
