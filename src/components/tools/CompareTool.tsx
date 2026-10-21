import React, { useState } from 'react';
import { UploadedFile, ToolDef, ProcessingState, ComparisonReport } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { compareTwoPdfs } from '../../utils/pdfCompare';
import { getPdfPageCount } from '../../utils/pdfRenderer';
import { GitCompare, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface CompareToolProps {
  tool: ToolDef;
  onBack: () => void;
}

export const CompareTool: React.FC<CompareToolProps> = ({ tool, onBack }) => {
  const [fileA, setFileA] = useState<UploadedFile | null>(null);
  const [fileB, setFileB] = useState<UploadedFile | null>(null);
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const f = e.target.files[0];
    const ab = await f.arrayBuffer();
    const bytes = new Uint8Array(ab);
    const count = await getPdfPageCount(bytes);

    const uploaded: UploadedFile = {
      id: `${f.name}-${Date.now()}`,
      file: f,
      name: f.name,
      size: f.size,
      data: bytes,
      pageCount: count,
    };

    if (target === 'A') {
      setFileA(uploaded);
    } else {
      setFileB(uploaded);
    }
    setReport(null);
  };

  const handleRunComparison = async () => {
    if (!fileA || !fileB) return;

    setProcessingState({
      status: 'processing',
      progress: 25,
      message: 'Extracting digital text from both documents...',
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 65,
        message: 'Calculating line-by-line and token-level diffs...',
      }));

      const res = await compareTwoPdfs(fileA.data, fileB.data, fileA.name, fileB.name);
      setReport(res);
      setSelectedPage(1);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: `Comparison complete! ${res.similarityScore}% match.`,
      });
    } catch (err: unknown) {
      console.error('Comparison error:', err);
      const errMsg = err instanceof Error ? err.message : 'Comparison failed';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const currentPageDiff = report?.pageDiffs.find((p) => p.pageNumber === selectedPage);

  const settingsContent = report && (
    <div className="space-y-4 text-xs">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700">Similarity Match</span>
          <span className="text-sm font-extrabold font-mono text-brand">
            {report.similarityScore}%
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${report.similarityScore}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
          <div>
            Identical Pages: <strong className="text-slate-900">{report.summary.identicalPages}</strong>
          </div>
          <div>
            Modified Pages: <strong className="text-slate-900">{report.summary.modifiedPages}</strong>
          </div>
          <div>
            Lines Added: <strong className="text-emerald-700">+{report.summary.addedLines}</strong>
          </div>
          <div>
            Lines Removed: <strong className="text-red-700">-{report.summary.removedLines}</strong>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Jump to Page</label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-brand outline-none"
        >
          {report.pageDiffs.map((p) => (
            <option key={p.pageNumber} value={p.pageNumber}>
              Page {p.pageNumber} ({p.status})
            </option>
          ))}
        </select>
      </div>

      <div className="p-3 bg-brand-light/30 border border-brand/20 rounded-xl text-[11px] text-slate-700 space-y-1">
        <div className="font-bold text-brand">Diff Legend</div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
            Green text
          </span>
          <span>Added in Document B</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded line-through font-mono">
            Red text
          </span>
          <span>Removed from Document A</span>
        </div>
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFileA(null);
        setFileB(null);
        setReport(null);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={fileA !== null && fileB !== null}
      onProcess={handleRunComparison}
      processButtonText="Run Side-by-Side Comparison"
      isProcessDisabled={!fileA || !fileB}
      settingsContent={settingsContent}
    >
      <div className="space-y-6">
        {/* Dual Upload Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* File A Box */}
          <div className="border border-slate-200 bg-white rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand" />
                <span>Document A (Original)</span>
              </span>
              {fileA && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  {fileA.pageCount} pages
                </span>
              )}
            </div>

            {fileA ? (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs truncate">
                <div className="font-bold text-slate-800 truncate">{fileA.name}</div>
                <label className="text-[11px] text-brand hover:underline cursor-pointer mt-1 inline-block">
                  Change file
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'A')}
                  />
                </label>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-slate-200 hover:border-brand rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'A')}
                />
                <span className="text-xs font-semibold text-brand">Select Document A</span>
              </label>
            )}
          </div>

          {/* File B Box */}
          <div className="border border-slate-200 bg-white rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-800" />
                <span>Document B (Revised)</span>
              </span>
              {fileB && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  {fileB.pageCount} pages
                </span>
              )}
            </div>

            {fileB ? (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs truncate">
                <div className="font-bold text-slate-800 truncate">{fileB.name}</div>
                <label className="text-[11px] text-brand hover:underline cursor-pointer mt-1 inline-block">
                  Change file
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'B')}
                  />
                </label>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-slate-200 hover:border-brand rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'B')}
                />
                <span className="text-xs font-semibold text-brand">Select Document B</span>
              </label>
            )}
          </div>
        </div>

        {/* Diff View Area */}
        {report && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-slate-900">
                  Page {selectedPage} Diff Analysis
                </h3>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded ${
                  currentPageDiff?.status === 'identical'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {currentPageDiff?.status === 'identical' ? 'Pages are Identical' : 'Changes Detected'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-h-[460px] overflow-y-auto leading-relaxed text-xs font-mono">
              {currentPageDiff ? (
                currentPageDiff.textDiffs.map((part, idx) => {
                  if (part.added) {
                    return (
                      <span key={idx} className="bg-emerald-100 text-emerald-900 px-0.5 rounded font-bold">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return (
                      <span
                        key={idx}
                        className="bg-red-100 text-red-800 px-0.5 rounded line-through opacity-80"
                      >
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={idx} className="text-slate-700">{part.value}</span>;
                })
              ) : (
                <div className="text-slate-400">Select a page to inspect differences.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
