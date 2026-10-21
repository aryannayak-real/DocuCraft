import React, { useState } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { renderPdfPageToCanvas } from '../../utils/pdfRenderer';
import { runClientOcr } from '../../utils/ocrOps';
import { downloadBlob } from '../../utils/downloadHelper';
import { Copy, Check, FileDown, ScanText, Sparkles } from 'lucide-react';

interface OcrToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const OcrTool: React.FC<OcrToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [language, setLanguage] = useState<'eng' | 'spa' | 'fra' | 'deu'>('eng');
  const [targetPage, setTargetPage] = useState<number>(1);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setExtractedText('');
      setTargetPage(1);
    }
  };

  const handleRunOcr = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 10,
      message: 'Rendering page to high-res canvas...',
    });

    try {
      // 1. Render page to canvas
      const canvas = await renderPdfPageToCanvas(file.data, targetPage, 2.0);

      setProcessingState({
        status: 'processing',
        progress: 25,
        message: 'Initializing Tesseract neural model worker...',
      });

      // 2. Run OCR with progress updates
      const recognized = await runClientOcr(canvas, language, (u) => {
        const pct = Math.round(u.progress * 100);
        setProcessingState((prev) => ({
          ...prev,
          progress: 30 + Math.floor(u.progress * 65),
          message: `${u.status} (${pct}%)`,
        }));
      });

      const finalContent = recognized.trim() || 'No legible text detected on this page.';
      setExtractedText(finalContent);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'OCR extraction complete!',
      });
    } catch (err: unknown) {
      console.error('OCR recognition error:', err);
      const errMsg = err instanceof Error ? err.message : 'OCR engine failed to recognize text';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const handleCopyClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const name = `${file.name.replace(/\.pdf$/i, '')}_page_${targetPage}_OCR.txt`;
    downloadBlob(blob, name);
  };

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Target Page to Extract</label>
        <select
          value={targetPage}
          onChange={(e) => setTargetPage(parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-blue-500 outline-none"
        >
          {Array.from({ length: file.pageCount }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Page {i + 1} of {file.pageCount}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Document Language</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'eng', label: 'English' },
            { id: 'spa', label: 'Spanish' },
            { id: 'fra', label: 'French' },
            { id: 'deu', label: 'German' },
          ].map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id as typeof language)}
              className={`py-2 px-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                language === lang.id
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-slate-600">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Client-Side Neural Engine</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The Tesseract neural OCR engine runs directly inside your web browser using WebAssembly.
        </p>
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setExtractedText('');
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleRunOcr}
      processButtonText={`Extract Text from Page ${targetPage}`}
      settingsContent={settingsContent}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select a scanned PDF or document to run OCR"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ScanText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{file.name}</h3>
                  <div className="text-xs text-slate-400">
                    Extracting Page {targetPage} of {file.pageCount}
                  </div>
                </div>
              </div>

              {extractedText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyClipboard}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Save .txt</span>
                  </button>
                </div>
              )}
            </div>

            {/* Extracted Text Box */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 mb-2 block">
                Recognized OCR Text (Selectable & Editable)
              </label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Click 'Extract Text from Page' on the right to start recognition..."
                rows={14}
                className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
