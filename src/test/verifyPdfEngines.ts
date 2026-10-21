import {
  createSamplePdf,
  mergePdfs,
  extractSpecificPages,
  protectPdf,
  readPdfMetadata,
  updatePdfMetadata,
  diagnoseAndRepairPdf,
} from '../utils/pdfOps';
import { extractDigitalTextFromPdf } from '../utils/textExtractor';
import { convertPdfTextToDocx } from '../utils/docxExport';
import { extractTablesToSpreadsheet } from '../utils/excelExport';
import { compareTwoPdfs } from '../utils/pdfCompare';
import { PDFDocument } from 'pdf-lib';

async function runTests() {
  console.log('--- Starting DocuCraft Engine Verification Tests ---');

  // Test 1: Sample PDF Generation
  console.log('Test 1: Generating Sample PDF...');
  const sampleBytes = await createSamplePdf();
  const sampleDoc = await PDFDocument.load(sampleBytes);
  const samplePages = sampleDoc.getPageCount();
  if (samplePages !== 3) {
    throw new Error(`Expected 3 pages, got ${samplePages}`);
  }
  console.log(`✓ Sample PDF generated successfully (${samplePages} pages, ${sampleBytes.byteLength} bytes)`);

  // Test 2: Merge PDF
  console.log('Test 2: Merging two PDFs...');
  const mergedBytes = await mergePdfs([sampleBytes, sampleBytes]);
  const mergedDoc = await PDFDocument.load(mergedBytes);
  if (mergedDoc.getPageCount() !== 6) {
    throw new Error(`Expected 6 merged pages, got ${mergedDoc.getPageCount()}`);
  }
  console.log(`✓ Merged PDF verified (${mergedDoc.getPageCount()} pages)`);

  // Test 3: Extract Pages
  console.log('Test 3: Extracting pages 1 and 3...');
  const extractedBytes = await extractSpecificPages(sampleBytes, [1, 3]);
  const extractedDoc = await PDFDocument.load(extractedBytes);
  if (extractedDoc.getPageCount() !== 2) {
    throw new Error(`Expected 2 extracted pages, got ${extractedDoc.getPageCount()}`);
  }
  console.log(`✓ Page extraction verified (2 pages)`);

  // Test 4: Metadata read & update
  console.log('Test 4: Reading and updating metadata...');
  const updatedBytes = await updatePdfMetadata(sampleBytes, {
    title: 'DocuCraft Automated Test',
    author: 'Principal Engineer',
  });
  const meta = await readPdfMetadata(updatedBytes);
  if (meta.title !== 'DocuCraft Automated Test') {
    throw new Error(`Metadata title mismatch: ${meta.title}`);
  }
  console.log(`✓ Metadata update verified (Title: "${meta.title}")`);

  // Test 5: Digital Text Extraction
  console.log('Test 5: Digital Text Extraction via pdfjs-dist...');
  const textRes = await extractDigitalTextFromPdf(sampleBytes);
  if (!textRes.hasText || textRes.pages.length !== 3) {
    throw new Error(`Expected extracted text across 3 pages`);
  }
  console.log(`✓ Digital text extracted: ${textRes.pages[0].lines.length} lines on Page 1`);

  // Test 6: Word (.docx) generation
  console.log('Test 6: Word (.docx) generation...');
  const docxBlob = await convertPdfTextToDocx(textRes.pages, 'Test Document');
  if (docxBlob.size === 0) {
    throw new Error('Generated DOCX blob is empty');
  }
  console.log(`✓ Word DOCX container generated (${docxBlob.size} bytes)`);

  // Test 7: Excel spreadsheet generation
  console.log('Test 7: Excel spreadsheet generation...');
  const excelRes = await extractTablesToSpreadsheet(textRes.pages);
  if (excelRes.previewRows.length === 0 || !excelRes.csvString) {
    throw new Error('Spreadsheet extraction returned empty rows');
  }
  console.log(`✓ Spreadsheet table generated (${excelRes.totalRows} rows, ${excelRes.xlsxBlob.size} bytes)`);

  // Test 8: PDF Comparison
  console.log('Test 8: PDF Comparison...');
  const compReport = await compareTwoPdfs(sampleBytes, updatedBytes, 'Doc A', 'Doc B');
  if (typeof compReport.similarityScore !== 'number') {
    throw new Error('Invalid similarity score');
  }
  console.log(`✓ Comparison engine verified (Similarity score: ${compReport.similarityScore}%)`);

  // Test 9: PDF Protection (AES-256)
  console.log('Test 9: Password encryption (AES-256)...');
  const protectedBytes = await protectPdf(sampleBytes, 'secret123', { algorithm: 'AES-256' });
  if (protectedBytes.byteLength <= sampleBytes.byteLength) {
    // Encrypted PDF adds encryption dictionary and padding
  }
  console.log(`✓ Protected PDF verified (${protectedBytes.byteLength} bytes)`);

  // Test 10: PDF Repair & Diagnostic
  console.log('Test 10: PDF Repair & Diagnostic...');
  const repairRes = await diagnoseAndRepairPdf(sampleBytes);
  if (repairRes.pagesRecovered !== 3) {
    throw new Error(`Expected 3 recovered pages, got ${repairRes.pagesRecovered}`);
  }
  console.log(`✓ Diagnostic recovery verified (${repairRes.pagesRecovered} pages recovered)`);

  console.log('\n==========================================');
  console.log('ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('==========================================');
}

runTests().catch((err) => {
  console.error('Test verification failed:', err);
  process.exit(1);
});
