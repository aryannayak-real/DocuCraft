import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderAllThumbnails } from '../../utils/pdfRenderer';
import { extractSpecificPages } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { PdfThumbnailGrid } from '../PdfThumbnailGrid';

interface ExtractPagesToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const ExtractPagesTool: React.FC<ExtractPagesToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [loading, setLoading] = useState(false);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setSelectedPages([]);
      return;
    }

    let isSubscribed = true;
    setLoading(true);

    renderAllThumbnails(file.data, file.pageCount).then((thumbs) => {
      if (isSubscribed) {
        setThumbnails(thumbs);
        setSelectedPages([1]);
        setLoading(false);
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

  const handleTogglePage = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    if (!file) return;
    setSelectedPages(Array.from({ length: file.pageCount }, (_, i) => i + 1));
  };

  const handleClearSelection = () => {
    setSelectedPages([]);
  };

  const handleExtract = async () => {
    if (!file || selectedPages.length === 0) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Extracting selected page streams...',
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 70,
        message: 'Building extracted document...',
      }));

      const extractedBytes = await extractSpecificPages(file.data, selectedPages);
      const filename = `${file.name.replace(/\.pdf$/i, '')}_extracted_${selectedPages.length}_pages.pdf`;
      const blob = new Blob([extractedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(extractedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Pages extracted successfully!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: extractedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Extraction error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to extract pages';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
        <div className="flex justify-between text-slate-600">
          <span>Pages selected:</span>
          <span className="font-bold text-slate-900">{selectedPages.length} of {file.pageCount}</span>
        </div>
        <div className="text-[11px] text-slate-500 truncate">
          {selectedPages.length > 0 ? selectedPages.join(', ') : 'None selected'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleSelectAll}
          className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={handleClearSelection}
          className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <p className="text-slate-500 leading-relaxed text-[11px]">
        Click thumbnails on the left to toggle which pages to include in the output PDF.
      </p>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setSelectedPages([]);
        setThumbnails([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleExtract}
      processButtonText={`Extract ${selectedPages.length} Pages to PDF`}
      isProcessDisabled={selectedPages.length === 0}
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF to extract specific pages"
          subtitle="or drag and drop document here"
        />
      ) : (
        <PdfThumbnailGrid
          pageCount={file.pageCount}
          thumbnails={thumbnails}
          loading={loading}
          selectedPages={selectedPages}
          onToggleSelectPage={handleTogglePage}
        />
      )}
    </ToolLayout>
  );
};
