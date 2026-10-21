import { diffWordsWithSpace, diffLines } from 'diff';
import { extractDigitalTextFromPdf } from './textExtractor';
import { ComparisonReport, PageComparisonDiff } from '../types';

/**
 * Compare two PDF documents page-by-page using digital text extraction and diff algorithms
 */
export async function compareTwoPdfs(
  fileABytes: Uint8Array,
  fileBBytes: Uint8Array,
  fileAName: string,
  fileBName: string
): Promise<ComparisonReport> {
  const [extractedA, extractedB] = await Promise.all([
    extractDigitalTextFromPdf(fileABytes),
    extractDigitalTextFromPdf(fileBBytes),
  ]);

  const maxPages = Math.max(extractedA.totalPages, extractedB.totalPages);
  const pageDiffs: PageComparisonDiff[] = [];

  let identicalPages = 0;
  let modifiedPages = 0;
  let addedLinesCount = 0;
  let removedLinesCount = 0;

  for (let i = 1; i <= maxPages; i++) {
    const textA = extractedA.pages.find((p) => p.pageNum === i)?.text || '';
    const textB = extractedB.pages.find((p) => p.pageNum === i)?.text || '';

    const existsInA = i <= extractedA.totalPages;
    const existsInB = i <= extractedB.totalPages;

    if (!existsInA) {
      pageDiffs.push({
        pageNumber: i,
        status: 'only_in_b',
        textDiffs: [{ value: textB, added: true }],
      });
      modifiedPages++;
      continue;
    }

    if (!existsInB) {
      pageDiffs.push({
        pageNumber: i,
        status: 'only_in_a',
        textDiffs: [{ value: textA, removed: true }],
      });
      modifiedPages++;
      continue;
    }

    if (textA.trim() === textB.trim()) {
      pageDiffs.push({
        pageNumber: i,
        status: 'identical',
        textDiffs: [{ value: textA }],
      });
      identicalPages++;
    } else {
      // Calculate word/token diffs
      const diffParts = diffWordsWithSpace(textA, textB);
      pageDiffs.push({
        pageNumber: i,
        status: 'modified',
        textDiffs: diffParts.map((p) => ({
          value: p.value,
          added: p.added,
          removed: p.removed,
        })),
      });
      modifiedPages++;

      // Count line changes
      const lineChanges = diffLines(textA, textB);
      lineChanges.forEach((lc) => {
        if (lc.added) addedLinesCount += lc.count || 1;
        if (lc.removed) removedLinesCount += lc.count || 1;
      });
    }
  }

  // Calculate similarity percentage
  const totalCompared = maxPages || 1;
  const similarityScore = Math.round((identicalPages / totalCompared) * 100);

  return {
    fileAName,
    fileBName,
    pageCountA: extractedA.totalPages,
    pageCountB: extractedB.totalPages,
    similarityScore,
    pageDiffs,
    summary: {
      identicalPages,
      modifiedPages,
      addedLines: addedLinesCount,
      removedLines: removedLinesCount,
    },
  };
}
