import React from 'react';
import { X, HelpCircle, FileQuestion, BookOpen, Layers } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (id: string) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onSelectTool }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Help & Documentation</h3>
            <p className="text-xs text-slate-500">How to get the most out of DocuCraft</p>
          </div>
        </div>

        <div className="space-y-3 py-2 text-xs text-slate-600 leading-relaxed max-h-[340px] overflow-y-auto">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <strong className="text-slate-900 block flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand" />
              <span>How do I merge multiple PDFs?</span>
            </strong>
            <p>
              Open <strong>Merge PDF</strong>, drop 2 or more files, use the arrow buttons to arrange their sequence, and click &ldquo;Merge PDFs&rdquo; to download the unified file.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <strong className="text-slate-900 block flex items-center gap-1.5">
              <FileQuestion className="w-3.5 h-3.5 text-brand" />
              <span>Why did OCR take a few moments?</span>
            </strong>
            <p>
              Tesseract.js downloads trained neural language weights directly to your browser memory and executes optical character recognition locally on your computer.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <strong className="text-slate-900 block flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span>Can I convert PDFs to Word and Excel?</span>
            </strong>
            <p>
              Yes! Use <strong>PDF to Word</strong> to get an editable .docx document, or <strong>PDF to Excel</strong> to detect financial and tabular rows and export as .xlsx or .csv.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
