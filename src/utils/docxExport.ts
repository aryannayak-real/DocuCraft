import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from 'docx';
import { PageTextResult } from './textExtractor';

/**
 * Generate a real, editable .docx document from extracted PDF text
 */
export async function convertPdfTextToDocx(
  pages: PageTextResult[],
  documentTitle = 'Converted Document'
): Promise<Blob> {
  const children: (Paragraph)[] = [];

  // Title header
  children.push(
    new Paragraph({
      text: documentTitle.replace(/\.pdf$/i, ''),
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Converted with DocuCraft · ${pages.length} Pages`,
          italics: true,
          color: '666666',
          size: 20, // 10pt
        }),
      ],
      spacing: { after: 300 },
    })
  );

  pages.forEach((page, pageIdx) => {
    // Add page section header
    children.push(
      new Paragraph({
        text: `Page ${page.pageNum}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    if (page.lines.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[No extractable text on this page]',
              italics: true,
              color: '999999',
            }),
          ],
          spacing: { after: 160 },
        })
      );
    } else {
      for (const line of page.lines) {
        // Detect potential bullet points or headings
        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: isBullet ? line.trim().substring(1).trim() : line,
                size: 22, // 11pt
              }),
            ],
            bullet: isBullet ? { level: 0 } : undefined,
            spacing: { after: 100 },
          })
        );
      }
    }

    // Add page break between pages (except last)
    if (pageIdx < pages.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
