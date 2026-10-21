import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Check } from 'lucide-react';

interface PdfThumbnailGridProps {
  pageCount: number;
  thumbnails: string[];
  loading?: boolean;
  selectedPages?: number[];
  onToggleSelectPage?: (pageNum: number) => void;
  renderOverlay?: (pageNum: number) => React.ReactNode;
  actionsBar?: (pageNum: number, index: number) => React.ReactNode;
  pageRotations?: Record<number, number>;
}

export const PdfThumbnailGrid: React.FC<PdfThumbnailGridProps> = ({
  pageCount,
  thumbnails,
  loading = false,
  selectedPages,
  onToggleSelectPage,
  renderOverlay,
  actionsBar,
  pageRotations = {},
}) => {
  // Zoom level: 1 = normal (4 cols), 0 = compact (6 cols), 2 = large (2-3 cols)
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getGridColsClass = () => {
    if (zoomLevel === 0) return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6';
    if (zoomLevel === 2) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  };

  return (
    <div className="space-y-4">
      {/* Workspace Navigation Bar with Zoom & Count */}
      <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-xs text-xs text-slate-600">
        <div className="flex items-center gap-2 font-medium">
          <span className="font-bold text-slate-800">{pageCount}</span>
          <span>{pageCount === 1 ? 'Page' : 'Pages'}</span>
          {selectedPages && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-brand font-semibold">{selectedPages.length} Selected</span>
            </>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
          <button
            type="button"
            disabled={zoomLevel === 0}
            onClick={() => setZoomLevel((z) => Math.max(0, z - 1))}
            className="p-1.5 rounded-md hover:bg-white text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-md hover:bg-white text-slate-600 transition-colors cursor-pointer"
            title="Reset Zoom / Fit"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={zoomLevel === 2}
            onClick={() => setZoomLevel((z) => Math.min(2, z + 1))}
            className="p-1.5 rounded-md hover:bg-white text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnails Grid */}
      <div className={`grid ${getGridColsClass()} gap-4`}>
        {Array.from({ length: pageCount }, (_, idx) => {
          const pageNum = idx + 1;
          const isSelected = selectedPages ? selectedPages.includes(pageNum) : true;
          const thumbUrl = thumbnails[idx];
          const rotation = pageRotations[idx] || 0;

          return (
            <div
              key={pageNum}
              onClick={() => onToggleSelectPage && onToggleSelectPage(pageNum)}
              className={`group relative bg-white border-2 rounded-xl p-3 flex flex-col items-center transition-all ${
                onToggleSelectPage ? 'cursor-pointer' : ''
              } ${
                isSelected
                  ? 'border-brand/90 ring-2 ring-brand/10 shadow-xs'
                  : 'border-slate-200 opacity-60 hover:opacity-90'
              }`}
            >
              {/* Page Number Badge */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono font-bold shadow-xs">
                {pageNum}
              </div>

              {/* Selection Checkbox */}
              {onToggleSelectPage && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all shadow-xs bg-white">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border border-slate-300" />
                  )}
                </div>
              )}

              {/* Thumbnail Container with Skeleton Loader */}
              <div className="w-full aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner relative">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${pageNum}`}
                    className="w-full h-full object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full animate-pulse bg-slate-100 flex flex-col items-center justify-center p-4">
                    <div className="w-8 h-2 bg-slate-200 rounded mb-2" />
                    <div className="w-16 h-2 bg-slate-200 rounded mb-1" />
                    <div className="w-12 h-2 bg-slate-200 rounded" />
                  </div>
                )}

                {/* Custom Overlay (e.g. Watermark preview) */}
                {renderOverlay && renderOverlay(pageNum)}
              </div>

              {/* Page Actions or details if provided */}
              {actionsBar && (
                <div className="w-full mt-2.5 pt-2 border-t border-slate-100">
                  {actionsBar(pageNum, idx)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
