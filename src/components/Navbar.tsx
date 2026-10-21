import React from 'react';
import { FileStack, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { ToolCategory } from '../types';

interface NavbarProps {
  onSelectCategory: (category: ToolCategory | 'all') => void;
  onOpenPrivacy: () => void;
  onHomeClick: () => void;
  onQuickSample: () => void;
  favoriteCount: number;
  onFilterFavorites: () => void;
  isFavoritesActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectCategory,
  onOpenPrivacy,
  onHomeClick,
  onQuickSample,
  favoriteCount,
  onFilterFavorites,
  isFavoritesActive,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-xs">
            <FileStack className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
            Docu<span className="text-brand">Craft</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectCategory('all')}
            className="hover:text-brand transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            All Tools
          </button>
          <button
            onClick={() => onSelectCategory('organize')}
            className="hover:text-brand transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Organize
          </button>
          <button
            onClick={() => onSelectCategory('convert')}
            className="hover:text-brand transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Convert
          </button>
          <button
            onClick={() => onSelectCategory('edit')}
            className="hover:text-brand transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Edit & Optimize
          </button>
          <button
            onClick={() => onSelectCategory('security')}
            className="hover:text-brand transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Security
          </button>
          <button
            onClick={onFilterFavorites}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isFavoritesActive ? 'text-amber-600 font-bold' : 'hover:text-amber-500 text-slate-500'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavoritesActive ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span>Favorites ({favoriteCount})</span>
          </button>
          <button
            onClick={onOpenPrivacy}
            className="hover:text-brand transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer text-slate-500"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Local Processing</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickSample}
            className="px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Try Sample PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
