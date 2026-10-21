import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { extractDigitalTextFromPdf, ExtractedPdfText } from '../../utils/textExtractor';
import { downloadBlob } from '../../utils/downloadHelper';
import { Copy, Check, FileDown, FileCode, AlertCircle } from 'lucide-react';

interface ExtractTextToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const ExtractTextTool: React.FC<ExtractTextToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [extractedData, setExtractedData] = useState<ExtractedPdfText | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | number>('all');

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setExtractedData(null);
      return;
    }

    let isSubscribed = true;

    extractDigitalTextFromPdf(file.data).then((res) => {
      if (isSubscribed) {
        setExtractedData(res);
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

  const handleCopy = () => {
    if (!extractedData) return;
    const textToCopy =
      activeTab === 'all'
        ? extractedData.fullText
        : extractedData.pages.find((p) => p.pageNum === activeTab)?.text || '';
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!file || !extractedData) return;
    const textToSave =
      activeTab === 'all'
        ? extractedData.fullText
        : extractedData.pages.find((p) => p.pageNum === activeTab)?.text || '';

    const suffix = activeTab === 'all' ? 'all_pages' : `page_${activeTab}`;
    const filename = `${file.name.replace(/\.pdf$/i, '')}_text_${suffix}.txt`;
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
  };

  const currentDisplayText = extractedData
    ? activeTab === 'all'
      ? extractedData.fullText
      : extractedData.pages.find((p) => p.pageNum === activeTab)?.text || ''
    : '';

  const wordCount = currentDisplayText.trim() ? currentDisplayText.trim().split(/\s+/).length : 0;
  const charCount = currentDisplayText.length;

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
        <div className="flex justify-between text-slate-600">
          <span>Words detected:</span>
          <span className="font-bold text-slate-900 font-mono">{wordCount}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Characters:</span>
          <span className="font-bold text-slate-900 font-mono">{charCount}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Page Filter</label>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-brand outline-none"
        >
          <option value="all">All Pages Combined</option>
          {extractedData?.pages.map((p) => (
            <option key={p.pageNum} value={p.pageNum}>
              Page {p.pageNum}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied to Clipboard!</span>
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
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Download as .txt</span>
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
        setExtractedData(null);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleDownloadTxt}
      processButtonText="Download .txt File"
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select digital PDF to extract text"
          subtitle="Instant extraction from text streams without OCR lag"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">Digital Text Stream</h3>
            </div>
            <div className="text-xs text-slate-500">
              {activeTab === 'all' ? 'All Document Pages' : `Page ${activeTab}`}
            </div>
          </div>

          {!extractedData?.hasText && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                No embedded digital text found in this PDF. If this is a scanned document or photograph, switch to the <strong>OCR Text Extractor</strong>.
              </span>
            </div>
          )}

          <textarea
            readOnly
            value={currentDisplayText}
            rows={16}
            placeholder="Extracting text from document..."
            className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand focus:bg-white transition-all leading-relaxed"
          />
        </div>
      )}
    </ToolLayout>
  );
};
