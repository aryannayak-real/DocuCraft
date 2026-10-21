import React from 'react';
import { X, FileStack, Shield, Zap, Sparkles } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
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
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs">
            <FileStack className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">About DocuCraft</h3>
            <p className="text-xs text-slate-500">Browser-First PDF Productivity Platform</p>
          </div>
        </div>

        <div className="space-y-3 py-2 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>DocuCraft</strong> was built with a fundamental architectural mission: to provide the comprehensive PDF manipulation power of platforms like iLovePDF and Adobe Acrobat, while guaranteeing complete, unconditional data privacy by executing 100% inside your browser.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Shield className="w-4 h-4 text-emerald-600 mb-1" />
              <div className="font-bold text-slate-900">Zero Server Uploads</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Your files never touch cloud servers.</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Zap className="w-4 h-4 text-amber-500 mb-1" />
              <div className="font-bold text-slate-900">Instant Execution</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Powered by WebAssembly & Web Workers.</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
