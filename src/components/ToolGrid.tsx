import React from 'react';
import { ToolDef, ToolCategory } from '../types';
import { ToolIcon } from './ToolIcon';
import { CATEGORIES } from '../data/tools';
import { ArrowRight, SearchX, Star, Clock, Trash2 } from 'lucide-react';

interface ToolGridProps {
  tools: ToolDef[];
  activeCategory: ToolCategory | 'all' | 'favorites';
  searchQuery: string;
  onSelectTool: (toolId: string) => void;
  onClearSearch: () => void;
  favoriteIds: string[];
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
  recentToolIds: string[];
  onClearRecentHistory: () => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  tools,
  activeCategory,
  searchQuery,
  onSelectTool,
  onClearSearch,
  favoriteIds,
  onToggleFavorite,
  recentToolIds,
  onClearRecentHistory,
}) => {
  // Empty state if nothing matches search
  if (tools.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No matching tools found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No tools match &ldquo;{searchQuery}&rdquo;. Try another keyword like &ldquo;protect&rdquo;, &ldquo;word&rdquo;, &ldquo;excel&rdquo;, or &ldquo;merge&rdquo;.
        </p>
        <button
          onClick={onClearSearch}
          className="mt-4 px-4 py-2 text-xs font-bold text-brand bg-brand-light hover:bg-brand-light/80 rounded-xl transition-colors cursor-pointer"
        >
          Clear Search
        </button>
      </div>
    );
  }

  // If Favorites category is selected
  if (activeCategory === 'favorites') {
    const favTools = tools.filter((t) => favoriteIds.includes(t.id));

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Your Starred Favorite Tools</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {favTools.length} {favTools.length === 1 ? 'tool' : 'tools'}
          </span>
        </div>

        {favTools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-2">
            <p>You have not starred any favorite tools yet.</p>
            <p className="text-slate-400">Click the star icon on any tool card below to pin it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSelect={onSelectTool}
                isFavorite={favoriteIds.includes(tool.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // If a specific category or search query is active, render flat grid
  if (activeCategory !== 'all' || searchQuery.trim() !== '') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onSelect={onSelectTool}
              isFavorite={favoriteIds.includes(tool.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default Home View: Show Recently Used (if any) + All Categories
  const recentTools = recentToolIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as ToolDef[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
      {/* Recently Used Section */}
      {recentTools.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase text-slate-600">
              <Clock className="w-3.5 h-3.5 text-brand" />
              <span>Recently Used</span>
            </h2>
            <button
              onClick={onClearRecentHistory}
              className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTools.slice(0, 4).map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSelect={onSelectTool}
                isFavorite={favoriteIds.includes(tool.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categorized Sections */}
      {CATEGORIES.map((cat) => {
        const catTools = tools.filter((t) => t.category === cat.id);
        if (catTools.length === 0) return null;

        return (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {cat.name}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {catTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelect={onSelectTool}
                  isFavorite={favoriteIds.includes(tool.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

interface ToolCardProps {
  tool: ToolDef;
  onSelect: (toolId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onSelect,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onSelect(tool.id)}
      className="group relative bg-white border border-slate-200/80 hover:border-brand/40 rounded-2xl p-5 transition-all duration-150 hover:shadow-md cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs transition-transform duration-150 group-hover:scale-105 ${tool.color}`}
          >
            <ToolIcon name={tool.iconName} className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {tool.isNew && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                New
              </span>
            )}

            {tool.popular && !tool.isNew && (
              <span className="text-[10px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded-md">
                Popular
              </span>
            )}

            {/* Favorite Star Button */}
            <button
              type="button"
              onClick={(e) => onToggleFavorite(e, tool.id)}
              className="p-1 rounded-md text-slate-300 hover:text-amber-500 hover:bg-slate-50 transition-colors"
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                }`}
              />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors tracking-tight">
          {tool.name}
        </h3>

        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-normal">
          {tool.shortDesc}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-brand transition-colors">
        <span>Use Tool</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};
