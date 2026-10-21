import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderAllThumbnails } from '../../utils/pdfRenderer';
import { parsePageRangeString, splitPdfByRanges } from '../../utils/pdfOps';
import { downloadZip, downloadUint8Array } from '../../utils/downloadHelper';
import { Check, Layers, FileArchive } from 'lucide-react';

interface SplitToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const SplitTool: React.FC<SplitToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [mode, setMode] = useState<'range' | 'extract_all'>('range');
  const [rangeText, setRangeText] = useState('1-2');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  // Load all thumbnails when file is loaded
  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      return;
    }

    let isSubscribed = true;
    setLoadingThumbnails(true);

    renderAllThumbnails(file.data, file.pageCount).then((thumbs) => {
      if (isSubscribed) {
        setThumbnails(thumbs);
        setLoadingThumbnails(false);
        // Default range text
        if (file.pageCount > 1) {
          setRangeText(`1-${Math.min(file.pageCount, 2)}`);
        } else {
          setRangeText('1');
        }
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [file]);

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const parsedPages = file ? parsePageRangeString(rangeText, file.pageCount) : [];

  const handleTogglePageInRange = (pageNum: number) => {
    if (!file) return;
    let nextList: number[];
    if (parsedPages.includes(pageNum)) {
      nextList = parsedPages.filter((p) => p !== pageNum);
    } else {
      nextList = [...parsedPages, pageNum].sort((a, b) => a - b);
    }
    setRangeText(nextList.join(', '));
  };

  const handleSplit = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Extracting page streams...',
    });

    try {
      if (mode === 'extract_all') {
        // Extract each single page as a standalone file
        const rangeGroups = Array.from({ length: file.pageCount }, (_, i) => ({
          name: `${file.name.replace(/\.pdf$/i, '')}_page_${i + 1}.pdf`,
          pageNumbers: [i + 1],
        }));

        setProcessingState((p) => ({ ...p, progress: 60, message: 'Bundling into ZIP archive...' }));
        const results = await splitPdfByRanges(file.data, rangeGroups);
        const zipName = `${file.name.replace(/\.pdf$/i, '')}_extracted_pages.zip`;
        await downloadZip(results, zipName);

        setProcessingState({
          status: 'success',
          progress: 100,
          message: 'All pages extracted to ZIP!',
          resultFileName: zipName,
        });
      } else {
        // Custom range
        if (parsedPages.length === 0) {
          throw new Error('Please specify at least one valid page number.');
        }

        const rangeGroups = [
          {
            name: `${file.name.replace(/\.pdf$/i, '')}_pages_${rangeText.replace(/[\s,]+/g, '_')}.pdf`,
            pageNumbers: parsedPages,
          },
        ];

        const [result] = await splitPdfByRanges(file.data, rangeGroups);
        if (!result) throw new Error('No pages were generated.');

        const blob = new Blob([result.data as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        downloadUint8Array(result.data, result.name);

        setProcessingState({
          status: 'success',
          progress: 100,
          message: 'Document split successfully!',
          resultUrl: url,
          resultFileName: result.name,
          resultSize: result.data.byteLength,
        });
      }
    } catch (err: unknown) {
      console.error('Split error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to split PDF document';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="space-y-2">
        <label className="font-semibold text-slate-800">Split Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('range')}
            className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
              mode === 'range'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Custom Range</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">e.g. 1-3, 5-8</div>
          </button>

          <button
            type="button"
            onClick={() => setMode('extract_all')}
            className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
              mode === 'extract_all'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <FileArchive className="w-3.5 h-3.5 text-blue-600" />
              <span>Extract All</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Download as ZIP</div>
          </button>
        </div>
      </div>

      {mode === 'range' ? (
        <div className="space-y-2">
          <label className="font-semibold text-slate-800">
            Page Ranges to Extract
          </label>
          <input
            type="text"
            value={rangeText}
            onChange={(e) => setRangeText(e.target.value)}
            placeholder="e.g. 1-3, 5"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
          />
          <p className="text-[11px] text-slate-500">
            Selected pages:{' '}
            <span className="font-bold text-slate-800">
              {parsedPages.length > 0 ? parsedPages.join(', ') : 'None'}
            </span>
          </p>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
          <div className="font-bold text-slate-900">Extract every page</div>
          <p className="text-[11px]">
            Every page from 1 to {file.pageCount} will be generated as a distinct PDF file and bundled into a .zip archive.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setThumbnails([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleSplit}
      processButtonText={mode === 'extract_all' ? 'Extract All to ZIP' : `Extract ${parsedPages.length} Pages`}
      isProcessDisabled={mode === 'range' && parsedPages.length === 0}
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select a PDF to split"
          subtitle="or drag and drop your document here"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Click thumbnail cards to toggle inclusion in the split range ({file.pageCount} pages total)
            </span>
            {loadingThumbnails && (
              <span className="text-slate-400">Rendering preview thumbnails...</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: file.pageCount }, (_, idx) => {
              const pageNum = idx + 1;
              const isSelected = mode === 'extract_all' || parsedPages.includes(pageNum);
              const thumbUrl = thumbnails[idx];

              return (
                <div
                  key={pageNum}
                  onClick={() => mode === 'range' && handleTogglePageInRange(pageNum)}
                  className={`group relative bg-white border-2 rounded-xl p-3 flex flex-col items-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand ring-2 ring-brand/10 shadow-xs'
                      : 'border-slate-200 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-all shadow-xs bg-white">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border border-slate-300" />
                    )}
                  </div>

                  <div className="w-full aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`Page ${pageNum}`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Loading...</div>
                    )}
                  </div>

                  <div className="mt-2 text-xs font-bold text-slate-700">
                    Page {pageNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
