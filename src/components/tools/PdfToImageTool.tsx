import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderPdfPageToCanvas } from '../../utils/pdfRenderer';
import { downloadZip, downloadBlob } from '../../utils/downloadHelper';
import { Download, FileArchive } from 'lucide-react';

interface PdfToImageToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const PdfToImageTool: React.FC<PdfToImageToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [scale, setScale] = useState<number>(2); // 2x for sharp rendering
  const [renderedPreviews, setRenderedPreviews] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setRenderedPreviews([]);
      return;
    }

    let isSubscribed = true;
    setRendering(true);

    const loadAll = async () => {
      const urls: string[] = [];
      for (let i = 1; i <= file.pageCount; i++) {
        try {
          const canvas = await renderPdfPageToCanvas(file.data, i, 1.2);
          const url = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.9);
          urls.push(url);
        } catch (e) {
          console.warn('Canvas render error page', i, e);
        }
      }
      if (isSubscribed) {
        setRenderedPreviews(urls);
        setRendering(false);
      }
    };

    loadAll();

    return () => {
      isSubscribed = false;
    };
  }, [file, format]);

  const handleDownloadSingle = async (pageNumber: number) => {
    if (!file) return;
    try {
      const canvas = await renderPdfPageToCanvas(file.data, pageNumber, scale);
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (blob) {
          const ext = format === 'png' ? 'png' : 'jpg';
          const name = `${file.name.replace(/\.pdf$/i, '')}_page_${pageNumber}.${ext}`;
          downloadBlob(blob, name);
        }
      }, mime, 0.95);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handleDownloadZip = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 20,
      message: 'Rendering high-resolution images...',
    });

    try {
      const ext = format === 'png' ? 'png' : 'jpg';
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const imageFiles: { name: string; data: Blob }[] = [];

      for (let i = 1; i <= file.pageCount; i++) {
        setProcessingState({
          status: 'processing',
          progress: 20 + Math.floor((i / file.pageCount) * 60),
          message: `Rendering page ${i} of ${file.pageCount}...`,
        });

        const canvas = await renderPdfPageToCanvas(file.data, i, scale);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, 0.95));

        if (blob) {
          imageFiles.push({
            name: `${file.name.replace(/\.pdf$/i, '')}_page_${i}.${ext}`,
            data: blob,
          });
        }
      }

      setProcessingState({
        status: 'processing',
        progress: 85,
        message: 'Packaging images into ZIP archive...',
      });

      const zipName = `${file.name.replace(/\.pdf$/i, '')}_images.zip`;
      await downloadZip(imageFiles, zipName);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'All pages downloaded as ZIP archive!',
        resultFileName: zipName,
      });
    } catch (err: unknown) {
      console.error('ZIP creation error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to export images';
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
        <label className="font-semibold text-slate-800">Image Format</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormat('jpeg')}
            className={`p-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              format === 'jpeg'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            JPG (Smaller file)
          </button>
          <button
            type="button"
            onClick={() => setFormat('png')}
            className={`p-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              format === 'png'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            PNG (Lossless)
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Resolution Scale</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScale(1.5)}
            className={`p-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              scale === 1.5
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Standard (150 DPI)
          </button>
          <button
            type="button"
            onClick={() => setScale(2.5)}
            className={`p-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              scale === 2.5
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            High Definition (300 DPI)
          </button>
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
        setRenderedPreviews([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleDownloadZip}
      processButtonText={`Download All ${file?.pageCount || 0} Pages as ZIP`}
      settingsContent={settingsContent}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={(fs) => fs.length > 0 && setFile(fs[0])}
          multiple={false}
          title="Select PDF to convert to images"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Extract high-resolution {format.toUpperCase()} images ({file.pageCount} pages)
            </span>
            {rendering && <span className="text-slate-400">Rendering high-res previews...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: file.pageCount }, (_, idx) => {
              const pageNum = idx + 1;
              const imgUrl = renderedPreviews[idx];

              return (
                <div
                  key={pageNum}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="w-full aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={`Page ${pageNum}`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Rendering...</div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-700">Page {pageNum}</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(pageNum)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>Save</span>
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
