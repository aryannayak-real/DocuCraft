import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { extractDigitalTextFromPdf, PageTextResult } from '../../utils/textExtractor';
import { convertPdfTextToDocx } from '../../utils/docxExport';
import { downloadBlob } from '../../utils/downloadHelper';
import { FileText, Sparkles, AlertCircle } from 'lucide-react';

interface PdfToWordToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const PdfToWordTool: React.FC<PdfToWordToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [extractedPages, setExtractedPages] = useState<PageTextResult[]>([]);
  const [hasScannedWarning, setHasScannedWarning] = useState(false);
  const [activePreviewPage, setActivePreviewPage] = useState<number>(1);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setExtractedPages([]);
      setHasScannedWarning(false);
      return;
    }

    let isSubscribed = true;

    extractDigitalTextFromPdf(file.data).then((res) => {
      if (isSubscribed) {
        setExtractedPages(res.pages);
        if (!res.hasText) {
          setHasScannedWarning(true);
        }
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

  const handleConvertToWord = async () => {
    if (!file || extractedPages.length === 0) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Reconstructing paragraph hierarchies and headings...',
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 70,
        message: 'Packaging OpenXML .docx container...',
      }));

      const docxBlob = await convertPdfTextToDocx(extractedPages, file.name);
      const filename = `${file.name.replace(/\.pdf$/i, '')}.docx`;
      const url = URL.createObjectURL(docxBlob);

      downloadBlob(docxBlob, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'Word (.docx) document generated successfully!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: docxBlob.size,
      });
    } catch (err: unknown) {
      console.error('Word export error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to export Word document';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const currentLines =
    extractedPages.find((p) => p.pageNum === activePreviewPage)?.lines || [];

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Target Document Format</label>
        <div className="p-3 bg-brand-light/50 border border-brand/30 rounded-xl flex items-center justify-between font-bold text-brand">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Microsoft Word (.docx)</span>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded shadow-xs">Standard</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Preview Page Text</label>
        <select
          value={activePreviewPage}
          onChange={(e) => setActivePreviewPage(parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-brand outline-none"
        >
          {extractedPages.map((p) => (
            <option key={p.pageNum} value={p.pageNum}>
              Page {p.pageNum} ({p.lines.length} lines)
            </option>
          ))}
        </select>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>Layout Preservation</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Paragraphs, section titles, and page breaks are preserved into a native OpenXML Word container. For image-only scans without digital text, use our OCR tool.
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
        setExtractedPages([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleConvertToWord}
      processButtonText="Convert & Download Word Document (.docx)"
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF to convert to Word"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-4">
          {hasScannedWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Notice: Minimal digital text found. If this is a scanned document, please use our OCR tool to extract handwritten or raster text.
              </span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Document Text & Paragraph Structure</h3>
                <p className="text-xs text-slate-400">Page {activePreviewPage} of {extractedPages.length}</p>
              </div>
              <span className="text-xs font-mono text-slate-500 font-medium">
                {currentLines.length} lines detected
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 max-h-[460px] overflow-y-auto space-y-2">
              {currentLines.length > 0 ? (
                currentLines.map((line, idx) => (
                  <p key={idx} className="text-xs text-slate-800 leading-relaxed font-sans">
                    {line}
                  </p>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">
                  No text stream identified on this page.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
