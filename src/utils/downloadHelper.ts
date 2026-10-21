import JSZip from 'jszip';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function downloadUint8Array(data: Uint8Array, filename: string, mimeType = 'application/pdf'): void {
  const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
  downloadBlob(blob, filename);
}

export async function downloadZip(
  files: { name: string; data: Uint8Array | Blob | string }[],
  zipName: string
): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.data);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipName.endsWith('.zip') ? zipName : `${zipName}.zip`);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
