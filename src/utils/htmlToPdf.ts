import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface WebpageToPdfOptions {
  orientation: 'p' | 'l';
  format: 'a4' | 'letter';
  scale?: number;
}

/**
 * Render an HTML element directly to a multi-page PDF using html2canvas and jsPDF
 */
export async function convertHtmlElementToPdf(
  element: HTMLElement,
  options: WebpageToPdfOptions = { orientation: 'p', format: 'a4', scale: 2 }
): Promise<Uint8Array> {
  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.format,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Additional pages if element overflows
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  const arrayBuffer = pdf.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
