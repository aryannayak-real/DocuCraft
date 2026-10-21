import React, { useRef, useState } from 'react';
import { UploadCloud, Sparkles, AlertCircle, AlertTriangle } from 'lucide-react';
import { createSamplePdf } from '../utils/pdfOps';
import { getPdfPageCount, renderPdfThumbnail } from '../utils/pdfRenderer';
import { UploadedFile } from '../types';

interface DropzoneProps {
  onFilesAdded: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  allowSample?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesAdded,
  accept = '.pdf,application/pdf',
  multiple = true,
  title = 'Select PDF files',
  subtitle = 'or drop PDF documents here',
  allowSample = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileList = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    setWarningMessage(null);
    const filesArray = Array.from(fileList);
    const validFiles: UploadedFile[] = [];

    for (const file of filesArray) {
      try {
        // Warn for files above 50MB
        if (file.size > 50 * 1024 * 1024) {
          setWarningMessage(
            `"${file.name}" is ${Math.round(file.size / (1024 * 1024))}MB. Large files may require more browser memory to render.`
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        let pageCount = 1;
        let thumb = '';

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          try {
            pageCount = await getPdfPageCount(uint8);
            thumb = await renderPdfThumbnail(uint8, 1, 200);
          } catch {
            pageCount = 1;
          }
        } else if (file.type.startsWith('image/')) {
          thumb = URL.createObjectURL(file);
        }

        validFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          name: file.name,
          size: file.size,
          data: uint8,
          pageCount,
          pages: [
            {
              pageIndex: 0,
              pageNumber: 1,
              thumbnailUrl: thumb,
              rotation: 0,
            },
          ],
        });
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMessage(`Could not read "${file.name}". Please ensure the file is not corrupted.`);
      }
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
      e.target.value = '';
    }
  };

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    setErrorMessage(null);
    setWarningMessage(null);
    try {
      const sampleBytes = await createSamplePdf();
      const sampleBlob = new Blob([sampleBytes as unknown as BlobPart], { type: 'application/pdf' });
      const sampleFile = new File([sampleBlob], 'DocuCraft_Sample_Report.pdf', { type: 'application/pdf' });
      const pageCount = await getPdfPageCount(sampleBytes);
      const thumb = await renderPdfThumbnail(sampleBytes, 1, 200);

      onFilesAdded([
        {
          id: `sample-${Date.now()}`,
          file: sampleFile,
          name: 'DocuCraft_Sample_Report.pdf',
          size: sampleBytes.byteLength,
          data: sampleBytes,
          pageCount,
          pages: [
            {
              pageIndex: 0,
              pageNumber: 1,
              thumbnailUrl: thumb,
              rotation: 0,
            },
          ],
        },
      ]);
    } catch (err) {
      console.error('Failed to generate sample PDF:', err);
      setErrorMessage('Could not initialize sample document.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 md:p-14 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-brand bg-brand-light/40 scale-[1.01]'
            : 'border-slate-300 hover:border-brand/70 bg-white hover:bg-slate-50/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-light text-brand flex items-center justify-center shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              className="px-6 py-2.5 bg-brand hover:bg-brand-hover active:bg-brand text-white font-bold text-sm rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select Files
            </button>

            {allowSample && (
              <button
                type="button"
                disabled={isLoadingSample}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample();
                }}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                {isLoadingSample ? 'Generating Demo...' : 'Load Sample PDF'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-3">
            <span>Client-side only</span>
            <span aria-hidden="true">·</span>
            <span>Zero server uploads</span>
            <span aria-hidden="true">·</span>
            <span>Encrypted in memory</span>
          </div>
        </div>
      </div>

      {warningMessage && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{warningMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
