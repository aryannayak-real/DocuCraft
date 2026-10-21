import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
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
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Terms of Service</h3>
            <p className="text-xs text-slate-500">Fair usage & local processing policy</p>
          </div>
        </div>

        <div className="space-y-3 py-2 text-xs text-slate-600 leading-relaxed max-h-[300px] overflow-y-auto">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <strong className="text-slate-900 block">1. Full User Ownership</strong>
            <span>All intellectual property, copyrights, and sensitive content contained in your uploaded documents remain strictly yours. DocuCraft claims zero rights or ownership.</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <strong className="text-slate-900 block">2. Local Computation</strong>
            <span>You acknowledge that all PDF compression, encryption, conversion, and OCR processing occurs on your personal hardware using client-side JavaScript.</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <strong className="text-slate-900 block">3. No Warranty on File Recovery</strong>
            <span>While our repair tools attempt structural reconstruction, severely corrupted binary files missing root page dictionaries cannot always be salvaged.</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
