import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState, PageNumberSettings } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderPdfThumbnail } from '../../utils/pdfRenderer';
import { addPageNumbersToPdf } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';

interface PageNumbersToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const PageNumbersTool: React.FC<PageNumbersToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [settings, setSettings] = useState<PageNumberSettings>({
    position: 'bottom-center',
    format: 'page_of_n',
    startNumber: 1,
    fontSize: 10,
    color: '#334155',
    margin: 30,
  });
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
    renderPdfThumbnail(file.data, 1, 340).then((thumb) => {
      setThumbnail(thumb);
    });
  }, [file]);

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleApplyNumbers = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Calculating page geometries...',
    });

    try {
      setProcessingState((p) => ({ ...p, progress: 65, message: 'Drawing page numbers...' }));

      const numberedBytes = await addPageNumbersToPdf(file.data, settings);
      const filename = `${file.name.replace(/\.pdf$/i, '')}_numbered.pdf`;
      const blob = new Blob([numberedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(numberedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Page numbers added to all pages!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: numberedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Page numbers error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to add page numbers';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const getPreviewText = () => {
    const total = file?.pageCount || 10;
    switch (settings.format) {
      case 'page_of_n':
        return `Page ${settings.startNumber} of ${total}`;
      case 'n_of_n':
        return `${settings.startNumber} / ${total}`;
      case 'page_n':
        return `Page ${settings.startNumber}`;
      case 'n_only':
      default:
        return `${settings.startNumber}`;
    }
  };

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Position on Page</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'top-left', label: 'Top Left' },
              { id: 'top-center', label: 'Top Center' },
              { id: 'top-right', label: 'Top Right' },
              { id: 'bottom-left', label: 'Bottom Left' },
              { id: 'bottom-center', label: 'Bottom Center' },
              { id: 'bottom-right', label: 'Bottom Right' },
            ] as const
          ).map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, position: pos.id }))}
              className={`py-2 px-1 text-[11px] rounded-lg border font-medium text-center transition-all cursor-pointer ${
                settings.position === pos.id
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Numbering Format</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'page_of_n', label: 'Page 1 of N' },
            { id: 'n_of_n', label: '1 / N' },
            { id: 'page_n', label: 'Page 1' },
            { id: 'n_only', label: '1' },
          ].map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() =>
                setSettings((s) => ({ ...s, format: fmt.id as PageNumberSettings['format'] }))
              }
              className={`py-2 px-2 text-center rounded-lg border font-medium transition-all cursor-pointer ${
                settings.format === fmt.id
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="font-semibold text-slate-800">Start Page #</label>
          <input
            type="number"
            min={1}
            value={settings.startNumber}
            onChange={(e) =>
              setSettings((s) => ({ ...s, startNumber: Math.max(1, parseInt(e.target.value) || 1) }))
            }
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-800">Font Size (pt)</label>
          <input
            type="number"
            min={8}
            max={24}
            value={settings.fontSize}
            onChange={(e) =>
              setSettings((s) => ({ ...s, fontSize: Math.max(8, parseInt(e.target.value) || 10) }))
            }
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:border-blue-500 outline-none"
          />
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
      onProcess={handleApplyNumbers}
      processButtonText={`Add Numbers to ${file?.pageCount || 0} Pages`}
      settingsContent={settingsContent}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF to add page numbers"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-600 flex justify-between">
            <span>Visual placement preview (Page 1)</span>
            <span>{file.pageCount} pages will be stamped</span>
          </div>

          <div className="bg-slate-100/80 p-8 rounded-2xl flex justify-center items-center shadow-inner">
            <div className="relative bg-white shadow-xl rounded-sm w-[300px] h-[424px] border border-slate-200 overflow-hidden flex items-center justify-center">
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

              {/* Live Overlay of Number */}
              <div
                className={`absolute px-2 py-0.5 font-sans font-medium text-slate-700 pointer-events-none ${
                  settings.position.startsWith('top') ? 'top-4' : 'bottom-4'
                } ${
                  settings.position.endsWith('left')
                    ? 'left-4'
                    : settings.position.endsWith('right')
                    ? 'right-4'
                    : 'left-1/2 -translate-x-1/2'
                }`}
                style={{
                  fontSize: `${settings.fontSize * 1.1}px`,
                  color: settings.color,
                }}
              >
                {getPreviewText()}
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
