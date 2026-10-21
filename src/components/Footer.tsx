import React from 'react';
import { FileStack, Shield } from 'lucide-react';
import { ToolCategory } from '../types';

interface FooterProps {
  onSelectCategory: (cat: ToolCategory | 'all') => void;
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenHelp: () => void;
  onSelectTool: (id: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenPrivacy,
  onOpenAbout,
  onOpenTerms,
  onOpenHelp,
  onSelectTool,
}) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white shadow-xs">
                <FileStack className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900">
                Docu<span className="text-brand">Craft</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Browser-first, privacy-preserving PDF productivity platform. Process, convert, encrypt, and edit files 100% locally.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero Server Transmission</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              Organize
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button
                  onClick={() => onSelectTool('merge')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('split')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('organize')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Organize & Reorder
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('rotate')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Rotate PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('extract-pages')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Extract Pages
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              Convert
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button
                  onClick={() => onSelectTool('image-to-pdf')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  JPG/PNG to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-image')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  PDF to JPG / PNG
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-word')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  PDF to Word (.docx)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-excel')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  PDF to Excel (.xlsx)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('html-to-pdf')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Webpage to PDF
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              Edit & Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button
                  onClick={() => onSelectTool('protect')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Protect PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('unlock')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Unlock PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('watermark')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Add Watermark
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('page-numbers')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Add Page Numbers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('annotate')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Annotate PDF
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              Optimize & More
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button
                  onClick={() => onSelectTool('compress')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('extract-text')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Extract Text
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('ocr')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  OCR Text Extractor
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('compare')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  PDF Compare
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('repair')}
                  className="hover:text-brand transition-colors cursor-pointer"
                >
                  Repair PDF
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} DocuCraft</span>
            <span aria-hidden="true">·</span>
            <span>Client-side PDF Platform</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={onOpenAbout}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={onOpenPrivacy}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={onOpenTerms}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={onOpenHelp}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Help & FAQ
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
