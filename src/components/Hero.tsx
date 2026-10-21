import React from 'react';
import { Search, X, Shield, Cpu, Zap, Star } from 'lucide-react';
import { ToolCategory, UploadedFile } from '../types';
import { Dropzone } from './Dropzone';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: ToolCategory | 'all' | 'favorites';
  onCategoryChange: (cat: ToolCategory | 'all' | 'favorites') => void;
  onFileDroppedOnHome: (files: UploadedFile[]) => void;
  favoriteCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  onFileDroppedOnHome,
  favoriteCount,
}) => {
  return (
    <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto space-y-6">
      {/* Editorial Title */}
      <div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 text-balance leading-tight">
          Every tool you need to work with PDFs in one place.
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto text-balance font-normal">
          High-performance, privacy-first PDF platform running 100% in your browser. Merge, split, convert, encrypt, edit, and OCR without server uploads.
        </p>

        {/* Feature trust markers */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 mt-3">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-brand" />
            <span>100% Client-Side Privacy</span>
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Cpu className="w-3.5 h-3.5 text-slate-700" />
            <span>Local WASM Engine</span>
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Zero Server Latency</span>
          </span>
        </div>
      </div>

      {/* Prominent Homepage Quick Dropzone */}
      <div className="pt-2 pb-4">
        <Dropzone
          onFilesAdded={onFileDroppedOnHome}
          multiple={true}
          title="Drop any PDF or Image to get started immediately"
          subtitle="Select a file and we'll help you pick the right tool"
          allowSample={true}
        />
      </div>

      {/* Search Input Bar */}
      <div className="max-w-xl mx-auto relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tools (e.g. protect, merge, word, excel, split, ocr)..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 rounded-2xl text-sm shadow-xs transition-all outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl max-w-2xl mx-auto border border-slate-200/60">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Tools (21)
        </button>
        <button
          onClick={() => onCategoryChange('favorites')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            activeCategory === 'favorites'
              ? 'bg-white text-brand shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
          <span>Favorites ({favoriteCount})</span>
        </button>
        <button
          onClick={() => onCategoryChange('organize')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'organize'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Organize
        </button>
        <button
          onClick={() => onCategoryChange('convert')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'convert'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Convert
        </button>
        <button
          onClick={() => onCategoryChange('edit')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'edit'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Edit & Optimize
        </button>
        <button
          onClick={() => onCategoryChange('security')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeCategory === 'security'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Security
        </button>
      </div>
    </section>
  );
};
