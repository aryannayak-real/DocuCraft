import React from 'react';
import { X, FileText } from 'lucide-react';
import { UploadedFile } from '../../types';
import { TOOLS } from '../../data/tools';
import { ToolIcon } from '../ToolIcon';
import { formatBytes } from '../../utils/downloadHelper';

interface HomeDropActionModalProps {
  files: UploadedFile[] | null;
  onClose: () => void;
  onSelectToolForFiles: (toolId: string) => void;
}

export const HomeDropActionModal: React.FC<HomeDropActionModalProps> = ({
  files,
  onClose,
  onSelectToolForFiles,
}) => {
  if (!files || files.length === 0) return null;

  const firstFile = files[0];
  const isImage = firstFile.file.type.startsWith('image/');

  // Relevant suggested tools based on file type
  const suggestedToolIds = isImage
    ? ['image-to-pdf', 'ocr']
    : files.length > 1
    ? ['merge']
    : ['split', 'protect', 'pdf-to-word', 'compress', 'watermark', 'pdf-to-excel', 'pdf-to-image', 'extract-pages', 'ocr', 'metadata', 'rotate'];

  const suggestedTools = suggestedToolIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {files.length === 1 ? 'File Loaded' : `${files.length} Files Loaded`}
            </h3>
            <p className="text-xs text-slate-500">
              {firstFile.name} {files.length > 1 ? `and ${files.length - 1} more` : ''} · {formatBytes(firstFile.size)}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium pt-1">
          Select what you would like to do with this {isImage ? 'image' : 'document'}:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pt-1">
          {suggestedTools.map((tool) => {
            if (!tool) return null;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectToolForFiles(tool.id)}
                className="p-3 bg-slate-50 hover:bg-brand-light/40 border border-slate-200 hover:border-brand/40 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-brand mb-2 shadow-2xs">
                  <ToolIcon name={tool.iconName} className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-brand">
                    {tool.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    {tool.shortDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
