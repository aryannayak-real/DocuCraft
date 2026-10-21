import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderAllThumbnails } from '../../utils/pdfRenderer';
import { rotatePdfPages } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { RotateCw, RotateCcw } from 'lucide-react';

interface RotateToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const RotateTool: React.FC<RotateToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setRotations({});
      return;
    }

    let isSubscribed = true;
    setLoading(true);

    renderAllThumbnails(file.data, file.pageCount).then((thumbs) => {
      if (isSubscribed) {
        setThumbnails(thumbs);
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

  const handleRotateSingle = (pageIdx: number, delta: number) => {
    setRotations((prev) => {
      const current = prev[pageIdx] || 0;
      const next = (current + delta + 360) % 360;
      return { ...prev, [pageIdx]: next };
    });
  };

  const handleRotateAll = (delta: number) => {
    if (!file) return;
    const newRotations: Record<number, number> = {};
    for (let i = 0; i < file.pageCount; i++) {
      const current = rotations[i] || 0;
      newRotations[i] = (current + delta + 360) % 360;
    }
    setRotations(newRotations);
  };

  const handleResetRotations = () => {
    setRotations({});
  };

  const handleSaveRotated = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 40,
      message: 'Applying orientation transformations...',
    });

    try {
      const rotatedData = await rotatePdfPages(file.data, rotations);

      const filename = `${file.name.replace(/\.pdf$/i, '')}_rotated.pdf`;
      const blob = new Blob([rotatedData as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(rotatedData, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Rotated document ready!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: rotatedData.byteLength,
      });
    } catch (err: unknown) {
      console.error('Rotate error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to rotate PDF';
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
        <label className="font-semibold text-slate-800">Batch Rotation</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleRotateAll(90)}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>All +90° Right</span>
          </button>
          <button
            type="button"
            onClick={() => handleRotateAll(-90)}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>All -90° Left</span>
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => handleRotateAll(180)}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
        >
          Invert All (180°)
        </button>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={handleResetRotations}
          className="w-full py-2 text-slate-400 hover:text-slate-600 text-[11px] transition-colors cursor-pointer"
        >
          Reset All Rotations
        </button>
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setThumbnails([]);
        setRotations({});
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleSaveRotated}
      processButtonText="Save & Download Rotated PDF"
      settingsContent={settingsContent}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select a PDF to rotate"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Click buttons on any page to rotate individual sheets ({file.pageCount} pages)
            </span>
            {loading && <span className="text-slate-400">Loading thumbnails...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: file.pageCount }, (_, idx) => {
              const rotation = rotations[idx] || 0;
              const thumbUrl = thumbnails[idx];

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="w-full aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Loading...</div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between w-full text-xs">
                    <span className="font-bold text-slate-700">Page {idx + 1}</span>
                    {rotation !== 0 && (
                      <span className="text-[10px] font-mono text-blue-600 font-bold">
                        +{rotation}°
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 w-full pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleRotateSingle(idx, -90)}
                      className="flex-1 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded text-center flex items-center justify-center transition-colors cursor-pointer"
                      title="Rotate Left"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateSingle(idx, 90)}
                      className="flex-1 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded text-center flex items-center justify-center transition-colors cursor-pointer"
                      title="Rotate Right"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
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
