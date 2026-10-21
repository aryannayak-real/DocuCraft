import React from 'react';
import { X, ShieldCheck, Cpu, HardDrive, WifiOff } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              100% Client-Side Privacy Guarantee
            </h3>
            <p className="text-xs text-slate-500">Your documents never leave your device</p>
          </div>
        </div>

        <div className="space-y-4 py-2 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <Cpu className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block text-xs">Zero Server Uploads</strong>
              Unlike traditional PDF web converters that upload your tax returns, financial statements, and confidential records to third-party cloud servers, DocuCraft processes files entirely in your browser memory.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <HardDrive className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block text-xs">No Database or Persistent Storage</strong>
              When you close the tab, all memory allocated by the browser is immediately flushed. We have no databases, telemetry loggers, or file stores.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <WifiOff className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block text-xs">Offline Functional</strong>
              Because the core processing engines (pdf-lib, pdf.js, Tesseract.js) are loaded client-side, documents can be merged and split even when working offline.
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
