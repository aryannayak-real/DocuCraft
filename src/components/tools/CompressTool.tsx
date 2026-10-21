import React, { useState } from 'react';
import { UploadedFile, ToolDef, ProcessingState, CompressSettings } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { compressPdf } from '../../utils/pdfOps';
import { downloadUint8Array, formatBytes } from '../../utils/downloadHelper';
import { Minimize2, CheckCircle2, TrendingDown } from 'lucide-react';

interface CompressToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const CompressTool: React.FC<CompressToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [level, setLevel] = useState<CompressSettings['level']>('recommended');
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    newSize: number;
    savedBytes: number;
    savedPercent: number;
    url: string;
    filename: string;
  } | null>(null);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCompressionResult(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Decompressing and parsing PDF cross-reference streams...',
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 70,
        message: 'Compacting object streams and removing redundant metadata...',
      }));

      const res = await compressPdf(file.data, level);
      const filename = `${file.name.replace(/\.pdf$/i, '')}_compressed.pdf`;
      const blob = new Blob([res.data as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const savedBytes = Math.max(0, res.originalSize - res.newSize);
      const savedPercent = res.originalSize > 0 ? Math.round((savedBytes / res.originalSize) * 100) : 0;

      downloadUint8Array(res.data, filename);

      setCompressionResult({
        originalSize: res.originalSize,
        newSize: res.newSize,
        savedBytes,
        savedPercent,
        url,
        filename,
      });

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'PDF compressed and optimized!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: res.newSize,
      });
    } catch (err: unknown) {
      console.error('Compression error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to compress document';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Compression Profile</label>
        <div className="space-y-2">
          {[
            {
              id: 'extreme',
              name: 'Extreme Compression',
              desc: 'Smallest size, high density stream compaction',
            },
            {
              id: 'recommended',
              name: 'Recommended Compression',
              desc: 'Optimal balance between fidelity and file size reduction',
            },
            {
              id: 'low',
              name: 'Low Compression',
              desc: 'Lossless stream reorganization and metadata cleanup',
            },
          ].map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setLevel(profile.id as CompressSettings['level'])}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                level === profile.id
                  ? 'border-brand bg-brand-light/40 text-slate-900 font-bold shadow-xs'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>{profile.name}</span>
                {level === profile.id && <span className="text-[10px] text-brand uppercase font-extrabold">Active</span>}
              </div>
              <div className="text-[11px] text-slate-500 font-normal mt-0.5">{profile.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
        <div className="font-bold text-slate-900">Compression Trade-Offs</div>
        <p className="text-[11px] leading-relaxed">
          Not all PDFs shrink significantly. PDFs that already contain pre-compressed images or pure vector lines experience modest gains. We perform lossless stream compaction and metadata pruning without degrading document fidelity.
        </p>
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setCompressionResult(null);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleCompress}
      processButtonText="Compress PDF"
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF to compress"
          subtitle="or drag and drop document here"
        />
      ) : (
        <div className="space-y-6">
          {/* File Card Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Minimize2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{file.name}</h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>{file.pageCount} pages</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    Original Size: {formatBytes(file.size)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Result Card if compressed */}
          {compressionResult && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Document successfully optimized!</span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                  <div className="text-[11px] text-slate-500">Before</div>
                  <div className="text-sm font-bold text-slate-700 mt-1 font-mono">
                    {formatBytes(compressionResult.originalSize)}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                  <div className="text-[11px] text-slate-500">After Compression</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1 font-mono">
                    {formatBytes(compressionResult.newSize)}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                  <div className="text-[11px] text-slate-500">Savings</div>
                  <div className="text-sm font-bold text-blue-600 mt-1 flex items-center justify-center gap-1 font-mono">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{compressionResult.savedPercent}% saved</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
