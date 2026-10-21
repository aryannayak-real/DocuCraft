import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState, AnnotationItem } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderPdfThumbnail } from '../../utils/pdfRenderer';
import { addAnnotationsToPdf } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { PenTool, Highlighter, Type, Square, Plus, Trash2 } from 'lucide-react';

interface AnnotateToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const AnnotateTool: React.FC<AnnotateToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([
    {
      id: 'ann-1',
      pageNumber: 1,
      type: 'text',
      x: 60,
      y: 720,
      text: 'REVIEWED & APPROVED',
      color: '#E5322D',
      opacity: 0.9,
    },
    {
      id: 'ann-2',
      pageNumber: 1,
      type: 'highlight',
      x: 60,
      y: 650,
      width: 280,
      height: 20,
      color: '#FDE047', // Yellow
      opacity: 0.45,
    },
  ]);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setThumbnail('');
      return;
    }
    renderPdfThumbnail(file.data, 1, 380).then((thumb) => {
      setThumbnail(thumb);
    });
  }, [file]);

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleAddAnnotation = (type: AnnotationItem['type']) => {
    const newItem: AnnotationItem = {
      id: `ann-${Date.now()}`,
      pageNumber: 1,
      type,
      x: 60,
      y: 500,
      text: type === 'text' ? 'New Annotation Note' : undefined,
      width: type === 'highlight' ? 220 : 160,
      height: type === 'highlight' ? 18 : 60,
      color: type === 'highlight' ? '#FDE047' : '#E5322D',
      opacity: type === 'highlight' ? 0.4 : 0.9,
    };
    setAnnotations((prev) => [...prev, newItem]);
  };

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveAnnotated = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Drawing vector annotation overlays...',
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 70,
        message: 'Stamping annotations onto PDF stream...',
      }));

      const annotatedBytes = await addAnnotationsToPdf(file.data, annotations);
      const filename = `${file.name.replace(/\.pdf$/i, '')}_annotated.pdf`;
      const blob = new Blob([annotatedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(annotatedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Annotations applied successfully!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: annotatedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Annotation error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to apply annotations';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Add Markup Element</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleAddAnnotation('text')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-brand" />
            <span>Text Note</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddAnnotation('highlight')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span>Highlight</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="font-semibold text-slate-800">Active Annotations ({annotations.length})</label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {annotations.map((ann, idx) => (
            <div key={ann.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 capitalize flex items-center gap-1">
                  {ann.type === 'text' ? <Type className="w-3 h-3" /> : <Highlighter className="w-3 h-3" />}
                  <span>#{idx + 1} {ann.type}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAnnotation(ann.id)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {ann.type === 'text' && (
                <input
                  type="text"
                  value={ann.text || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAnnotations((prev) =>
                      prev.map((a) => (a.id === ann.id ? { ...a, text: val } : a))
                    );
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 text-[11px]"
                />
              )}

              <div className="flex items-center gap-3 text-[11px]">
                <label className="flex items-center gap-1">
                  <span>Color:</span>
                  <input
                    type="color"
                    value={ann.color}
                    onChange={(e) => {
                      const c = e.target.value;
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === ann.id ? { ...a, color: c } : a))
                      );
                    }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setThumbnail('');
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleSaveAnnotated}
      processButtonText="Apply Annotations & Save"
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF to annotate & mark up"
          subtitle="or drop document here"
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-600 flex justify-between">
            <span>Visual placement preview (Page 1)</span>
            <span>{annotations.length} markups applied</span>
          </div>

          <div className="bg-slate-100 p-8 rounded-2xl flex justify-center items-center shadow-inner">
            <div className="relative bg-white shadow-xl rounded-sm w-[320px] h-[452px] border border-slate-200 overflow-hidden flex items-center justify-center select-none">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Page Preview"
                  className="w-full h-full object-contain pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-xs text-slate-400">Loading document...</div>
              )}

              {/* Render annotation markers visually */}
              {annotations.map((ann) => {
                if (ann.type === 'text') {
                  return (
                    <div
                      key={ann.id}
                      className="absolute px-2 py-0.5 rounded text-xs font-bold pointer-events-none shadow-xs"
                      style={{
                        left: `${(ann.x / 595) * 100}%`,
                        top: `${((842 - ann.y) / 842) * 100}%`,
                        color: ann.color,
                        opacity: ann.opacity,
                      }}
                    >
                      {ann.text}
                    </div>
                  );
                }
                return (
                  <div
                    key={ann.id}
                    className="absolute pointer-events-none rounded-xs"
                    style={{
                      left: `${(ann.x / 595) * 100}%`,
                      top: `${((842 - ann.y) / 842) * 100}%`,
                      width: `${((ann.width || 100) / 595) * 100}%`,
                      height: `${((ann.height || 20) / 842) * 100}%`,
                      backgroundColor: ann.color,
                      opacity: ann.opacity,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
