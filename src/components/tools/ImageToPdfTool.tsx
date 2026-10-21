import React, { useState } from 'react';
import { ToolDef, ProcessingState, ImageToPdfSettings } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { imagesToPdf } from '../../utils/pdfOps';
import { downloadUint8Array, formatBytes } from '../../utils/downloadHelper';
import { UploadCloud, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

interface ImageToPdfToolProps {
  tool: ToolDef;
  onBack: () => void;
}

interface ImageItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  width: number;
  height: number;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({ tool, onBack }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [settings, setSettings] = useState<ImageToPdfSettings>({
    orientation: 'portrait',
    margin: 'small',
    pageSize: 'a4',
  });
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleImageFiles = async (fileList: FileList | File[]) => {
    const newItems: ImageItem[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Get dimensions
      const img = new window.Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = dataUrl;
      });

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        dataUrl,
        width: img.width,
        height: img.height,
      });
    }

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setImages(copy);
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Compiling image streams...',
    });

    try {
      setProcessingState((p) => ({ ...p, progress: 65, message: 'Constructing PDF pages...' }));

      const pdfData = await imagesToPdf(images, settings);
      const filename = `DocuCraft_Images_${Date.now()}.pdf`;
      const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(pdfData, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'PDF generated from images!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: pdfData.byteLength,
      });
    } catch (err: unknown) {
      console.error('Image to PDF error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to convert images to PDF';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const settingsContent = images.length > 0 && (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Page Orientation</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['portrait', 'landscape', 'auto'] as const).map((orient) => (
            <button
              key={orient}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, orientation: orient }))}
              className={`py-2 px-2 rounded-lg border font-medium capitalize text-center transition-all cursor-pointer ${
                settings.orientation === orient
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {orient}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Page Size</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'a4', label: 'A4' },
            { id: 'letter', label: 'Letter' },
            { id: 'fit', label: 'Fit Image' },
          ].map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() =>
                setSettings((s) => ({ ...s, pageSize: size.id as ImageToPdfSettings['pageSize'] }))
              }
              className={`py-2 px-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                settings.pageSize === size.id
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Margins</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['none', 'small', 'normal'] as const).map((margin) => (
            <button
              key={margin}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, margin }))}
              className={`py-2 px-2 rounded-lg border font-medium capitalize text-center transition-all cursor-pointer ${
                settings.margin === margin
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {margin}
            </button>
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
        setImages([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={images.length > 0}
      onProcess={handleConvert}
      processButtonText={`Convert ${images.length} ${images.length === 1 ? 'Image' : 'Images'} to PDF`}
      isProcessDisabled={images.length === 0}
      settingsContent={settingsContent}
    >
      {images.length === 0 ? (
        <div className="w-full max-w-3xl mx-auto">
          <label className="block border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50 rounded-2xl p-12 text-center transition-all cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Select JPG or PNG images</h3>
            <p className="text-sm text-slate-500 mt-1">or drag and drop images directly here</p>
            <div className="mt-5">
              <span className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl shadow-sm inline-block">
                Browse Images
              </span>
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Arrange image order ({images.length} images)</span>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Images</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="w-full aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="mt-2.5 w-full">
                  <div className="text-xs font-semibold text-slate-800 truncate" title={img.name}>
                    {img.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatBytes(img.size)} · {img.width}x{img.height}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between w-full pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Left"
                    >
                      <ArrowUp className="w-3.5 h-3.5 rotate-[-90deg]" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Right"
                    >
                      <ArrowDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
