import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ToolDef, ProcessingState, UploadedFile } from '../types';
import { formatBytes } from '../utils/downloadHelper';
import { ToolIcon } from './ToolIcon';

interface ToolLayoutProps {
  tool: ToolDef;
  onBack: () => void;
  onReset: () => void;
  processingState: ProcessingState;
  hasFiles: boolean;
  onProcess: () => void;
  processButtonText?: string;
  isProcessDisabled?: boolean;
  settingsContent?: React.ReactNode;
  activeFile?: UploadedFile | null;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  onBack,
  onReset,
  processingState,
  hasFiles,
  onProcess,
  processButtonText = 'Process & Download',
  isProcessDisabled = false,
  settingsContent,
  activeFile,
  children,
}) => {
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Tools</span>
          </button>

          <span className="text-slate-300">/</span>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center font-bold">
              <ToolIcon name={tool.iconName} className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {tool.name}
            </h1>
          </div>
        </div>

        {/* File Info pill in header if file is active */}
        {activeFile && (
          <div className="flex items-center gap-3 text-xs bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <span className="font-semibold text-slate-800 max-w-[180px] sm:max-w-[260px] truncate" title={activeFile.name}>
              {activeFile.name}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-mono">{activeFile.pageCount} {activeFile.pageCount === 1 ? 'page' : 'pages'}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 font-mono">{formatBytes(activeFile.size)}</span>
          </div>
        )}

        {hasFiles && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Preview Workspace */}
        <div className={hasFiles && settingsContent ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {children}
        </div>

        {/* Right Settings Sidebar */}
        {hasFiles && settingsContent && (
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            {/* Mobile collapsible toggle */}
            <div className="lg:hidden flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand" />
                <span>Tool Options & Action</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileSettingsOpen(!mobileSettingsOpen)}
                className="text-slate-500 p-1"
              >
                {mobileSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div
              className={`bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 transition-all ${
                mobileSettingsOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-brand" />
                  <span>Configuration</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">100% Client-Side</span>
              </div>

              {settingsContent}

              {/* Progress State */}
              {processingState.status === 'processing' && (
                <div className="space-y-2 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs text-slate-700 font-medium">
                    <span className="truncate pr-2">{processingState.message || 'Processing document...'}</span>
                    {!processingState.indeterminate && (
                      <span className="font-mono tabular-nums shrink-0 font-bold text-brand">
                        {Math.round(processingState.progress)}%
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    {processingState.indeterminate ? (
                      <div className="h-full bg-brand rounded-full animate-pulse w-3/4" />
                    ) : (
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(8, processingState.progress)}%` }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Success Result */}
              {processingState.status === 'success' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Processing Complete!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 truncate">
                    {processingState.resultFileName}
                    {processingState.resultSize ? ` (${formatBytes(processingState.resultSize)})` : ''}
                  </p>
                  {processingState.resultUrl && (
                    <a
                      href={processingState.resultUrl}
                      download={processingState.resultFileName}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs mt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File Again</span>
                    </a>
                  )}
                </div>
              )}

              {/* Error Message */}
              {processingState.status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed">
                  <div className="font-bold text-red-800 mb-0.5">Execution Failed</div>
                  {processingState.message || 'An error occurred during processing.'}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="button"
                disabled={isProcessDisabled || processingState.status === 'processing'}
                onClick={onProcess}
                className="w-full py-3.5 px-4 bg-brand hover:bg-brand-hover active:bg-brand text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {processingState.status === 'processing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing in Browser...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{processButtonText}</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 text-center">
                Files are processed securely in your browser.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
