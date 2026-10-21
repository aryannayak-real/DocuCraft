import React, { useState } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { mergePdfs } from '../../utils/pdfOps';
import { downloadUint8Array, formatBytes } from '../../utils/downloadHelper';
import { FileText, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

interface MergeToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const MergeTool: React.FC<MergeToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const newFiles = [...files];
    const [moved] = newFiles.splice(index, 1);
    newFiles.splice(targetIndex, 0, moved);
    setFiles(newFiles);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    setProcessingState({
      status: 'processing',
      progress: 25,
      message: 'Reading and parsing PDF documents...',
    });

    try {
      setProcessingState((prev) => ({
        ...prev,
        progress: 60,
        message: 'Combining pages into unified document...',
      }));

      const buffers = files.map((f) => f.data);
      const mergedBytes = await mergePdfs(buffers);

      const filename = `DocuCraft_Merged_${Date.now()}.pdf`;
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Automatic download
      downloadUint8Array(mergedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Merged successfully!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: mergedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Merge error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to merge documents';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  const settingsContent = (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
        <div className="flex justify-between text-slate-600">
          <span>Files to merge:</span>
          <span className="font-bold text-slate-900">{files.length}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Total page count:</span>
          <span className="font-bold text-slate-900">{totalPages} pages</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Combined size:</span>
          <span className="font-bold text-slate-900">{formatBytes(totalSize)}</span>
        </div>
      </div>

      <p className="text-slate-500 leading-relaxed">
        Use the arrow buttons to arrange files in the exact sequence you want them to appear in the merged output.
      </p>

      {files.length === 1 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
          Please add at least 1 more PDF file to enable merging.
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFiles([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={files.length > 0}
      onProcess={handleMerge}
      processButtonText={`Merge ${files.length} PDFs`}
      isProcessDisabled={files.length < 2}
      settingsContent={settingsContent}
    >
      {files.length === 0 ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          title="Select 2 or more PDF files to merge"
          subtitle="or drag and drop multiple PDF documents here"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Drag or reorder sequence ({files.length} files)
            </span>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Files</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const fl = Array.from(e.target.files);
                    const items: UploadedFile[] = [];
                    for (const f of fl) {
                      const ab = await f.arrayBuffer();
                      items.push({
                        id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        file: f,
                        name: f.name,
                        size: f.size,
                        data: new Uint8Array(ab),
                        pageCount: 1,
                      });
                    }
                    setFiles((prev) => [...prev, ...items]);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>

          <div className="space-y-3">
            {files.map((file, idx) => (
              <div
                key={file.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatBytes(file.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === files.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
