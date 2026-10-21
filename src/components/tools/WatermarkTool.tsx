import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState, WatermarkSettings } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderPdfThumbnail } from '../../utils/pdfRenderer';
import { addWatermarkToPdf } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';

interface WatermarkToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [settings, setSettings] = useState<WatermarkSettings>({
    text: 'CONFIDENTIAL',
    opacity: 0.35,
    rotation: 45,
    fontSize: 48,
    color: '#dc2626', // Red
    position: 'center',
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
    renderPdfThumbnail(file.data, 1, 360).then((thumb) => {
      setThumbnail(thumb);
    });
  }, [file]);

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Generating vector watermark overlay...',
    });

    try {
      setProcessingState((p) => ({ ...p, progress: 65, message: 'Stamping pages...' }));

      const watermarkedBytes = await addWatermarkToPdf(file.data, settings);
      const filename = `${file.name.replace(/\.pdf$/i, '')}_watermarked.pdf`;
      const blob = new Blob([watermarkedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(watermarkedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Watermark stamped across all pages!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: watermarkedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Watermark error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to apply watermark';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const presetWords = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'INTERNAL USE ONLY'];

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      {/* Watermark text */}
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Watermark Text</label>
        <input
          type="text"
          value={settings.text}
          onChange={(e) => setSettings((s) => ({ ...s, text: e.target.value }))}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:border-blue-500 outline-none"
        />
        <div className="flex flex-wrap gap-1 pt-1">
          {presetWords.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, text: word }))}
              className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-slate-700">
          <label className="font-semibold">Opacity</label>
          <span className="font-mono text-slate-500">{Math.round(settings.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={settings.opacity}
          onChange={(e) => setSettings((s) => ({ ...s, opacity: parseFloat(e.target.value) }))}
          className="w-full accent-blue-600"
        />
      </div>

      {/* Rotation Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-slate-700">
          <label className="font-semibold">Rotation Angle</label>
          <span className="font-mono text-slate-500">{settings.rotation}°</span>
        </div>
        <input
          type="range"
          min={-90}
          max={90}
          step={5}
          value={settings.rotation}
          onChange={(e) => setSettings((s) => ({ ...s, rotation: parseInt(e.target.value, 10) }))}
          className="w-full accent-blue-600"
        />
        <div className="flex gap-1.5 pt-1">
          {[-45, 0, 45].map((ang) => (
            <button
              key={ang}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, rotation: ang }))}
              className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded text-center text-[10px] font-medium text-slate-700 cursor-pointer"
            >
              {ang}°
            </button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Placement Pattern</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, position: 'center' }))}
            className={`p-2 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
              settings.position === 'center'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Center Diagonal
          </button>
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, position: 'tiled' }))}
            className={`p-2 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
              settings.position === 'tiled'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Tiled Grid (3x3)
          </button>
        </div>
      </div>

      {/* Font Size & Color */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="font-semibold text-slate-800">Font Size (pt)</label>
          <input
            type="number"
            min={16}
            max={96}
            value={settings.fontSize}
            onChange={(e) =>
              setSettings((s) => ({ ...s, fontSize: Math.max(16, parseInt(e.target.value) || 32) }))
            }
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:border-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-800">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.color}
              onChange={(e) => setSettings((s) => ({ ...s, color: e.target.value }))}
              className="w-8 h-8 rounded border border-slate-200 p-0.5 cursor-pointer"
            />
            <span className="font-mono text-xs text-slate-600 uppercase">{settings.color}</span>
          </div>
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
      onProcess={handleApplyWatermark}
      processButtonText={`Apply Watermark (${file?.pageCount || 0} pages)`}
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF to add watermark"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-600 flex justify-between">
            <span>Live visual watermark preview on Page 1</span>
            <span>Applied to all {file.pageCount} pages</span>
          </div>

          <div className="bg-slate-100/80 p-8 rounded-2xl flex justify-center items-center shadow-inner">
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

              {/* Watermark Overlay Preview */}
              {settings.position === 'center' ? (
                <div
                  className="absolute pointer-events-none text-center font-extrabold uppercase tracking-widest whitespace-nowrap"
                  style={{
                    color: settings.color,
                    opacity: settings.opacity,
                    transform: `rotate(-${settings.rotation}deg)`,
                    fontSize: `${settings.fontSize * 0.55}px`,
                  }}
                >
                  {settings.text}
                </div>
              ) : (
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 p-4 pointer-events-none place-items-center">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="font-extrabold uppercase tracking-wider whitespace-nowrap text-center"
                      style={{
                        color: settings.color,
                        opacity: settings.opacity,
                        transform: `rotate(-${settings.rotation}deg)`,
                        fontSize: `${settings.fontSize * 0.35}px`,
                      }}
                    >
                      {settings.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
