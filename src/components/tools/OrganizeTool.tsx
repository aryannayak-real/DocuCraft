import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderAllThumbnails } from '../../utils/pdfRenderer';
import { reorderAndRefinePages } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { Trash2, RotateCw, Copy, ArrowLeft, ArrowRight, Undo } from 'lucide-react';

interface OrganizeToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnailUrl: string;
}

export const OrganizeTool: React.FC<OrganizeToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletedPagesHistory, setDeletedPagesHistory] = useState<PageItem[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setPages([]);
      return;
    }

    let isSubscribed = true;
    setLoading(true);

    renderAllThumbnails(file.data, file.pageCount).then((thumbs) => {
      if (isSubscribed) {
        const initialPageItems: PageItem[] = thumbs.map((thumb, idx) => ({
          id: `page-${idx}-${Date.now()}`,
          originalIndex: idx,
          rotation: 0,
          thumbnailUrl: thumb,
        }));
        setPages(initialPageItems);
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

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;

    const copy = [...pages];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setPages(copy);
  };

  const handleDelete = (index: number) => {
    if (pages.length <= 1) {
      alert('You cannot delete all pages. The document must have at least one page.');
      return;
    }
    const item = pages[index];
    setDeletedPagesHistory((prev) => [...prev, item]);
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUndoDelete = () => {
    if (deletedPagesHistory.length === 0) return;
    const lastDeleted = deletedPagesHistory[deletedPagesHistory.length - 1];
    setDeletedPagesHistory((prev) => prev.slice(0, -1));
    setPages((prev) => [...prev, lastDeleted]);
  };

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDuplicatePage = (index: number) => {
    const target = pages[index];
    const newPage: PageItem = {
      ...target,
      id: `copy-${Date.now()}-${Math.random()}`,
    };
    const copy = [...pages];
    copy.splice(index + 1, 0, newPage);
    setPages(copy);
  };

  const handleOrganizeSave = async () => {
    if (!file || pages.length === 0) return;

    setProcessingState({
      status: 'processing',
      progress: 40,
      message: 'Reordering and refining pages...',
    });

    try {
      const refinedData = await reorderAndRefinePages(
        file.data,
        pages.map((p) => ({ originalIndex: p.originalIndex, rotation: p.rotation }))
      );

      const filename = `${file.name.replace(/\.pdf$/i, '')}_organized.pdf`;
      const blob = new Blob([refinedData as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(refinedData, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Organized document generated!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: refinedData.byteLength,
      });
    } catch (err: unknown) {
      console.error('Organize save error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to refine PDF';
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
          <span>Active pages in doc:</span>
          <span className="font-bold text-slate-900">{pages.length}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Original page count:</span>
          <span className="font-bold text-slate-900">{file.pageCount}</span>
        </div>
      </div>

      {deletedPagesHistory.length > 0 && (
        <button
          type="button"
          onClick={handleUndoDelete}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Undo className="w-3.5 h-3.5 text-slate-500" />
          <span>Restore Deleted Page ({deletedPagesHistory.length})</span>
        </button>
      )}

      <div className="text-slate-500 space-y-1.5 leading-relaxed">
        <p>• Move pages left/right to reorganize</p>
        <p>• Rotate specific upside-down sheets</p>
        <p>• Click the trash can to delete unwanted pages</p>
        <p>• Duplicate key reference pages</p>
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setPages([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleOrganizeSave}
      processButtonText={`Save Refined PDF (${pages.length} pages)`}
      isProcessDisabled={pages.length === 0}
      settingsContent={settingsContent}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select a PDF to organize and reorder"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Reorder, rotate, or delete individual pages ({pages.length} pages)
            </span>
            {loading && <span className="text-slate-400">Loading visual grid...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex flex-col items-center shadow-xs transition-all"
              >
                {/* Page Index Badge */}
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono font-bold">
                  #{idx + 1}
                </div>

                {/* Page Canvas Container with rotation */}
                <div className="w-full aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain transition-transform duration-200"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Loading...</div>
                  )}
                </div>

                {/* Per-Page Actions Toolbar */}
                <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'left')}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pages.length - 1}
                      onClick={() => handleMove(idx, 'right')}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRotatePage(idx)}
                      className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicatePage(idx)}
                      className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
