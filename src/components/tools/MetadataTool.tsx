import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState, PdfMetadata } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { readPdfMetadata, updatePdfMetadata } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { Tag, Sparkles } from 'lucide-react';

interface MetadataToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const MetadataTool: React.FC<MetadataToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: [],
    creator: '',
    producer: '',
  });
  const [keywordsInput, setKeywordsInput] = useState('');

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) return;

    let isSubscribed = true;

    readPdfMetadata(file.data).then((meta) => {
      if (isSubscribed) {
        setMetadata(meta);
        setKeywordsInput(meta.keywords.join(', '));
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [file]);

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleSaveMetadata = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 30,
      message: 'Writing document dictionary meta tags...',
    });

    try {
      const kw = keywordsInput
        .split(/[,;]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      const updatedBytes = await updatePdfMetadata(file.data, {
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        keywords: kw,
        creator: metadata.creator,
        producer: metadata.producer,
      });

      const filename = `${file.name.replace(/\.pdf$/i, '')}_updated_meta.pdf`;
      const blob = new Blob([updatedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(updatedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'PDF metadata updated successfully!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: updatedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Metadata update error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to update metadata';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const settingsContent = file && (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>SEO & Archival Compliance</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Standard PDF metadata helps search engines, digital libraries, and desktop spotlight searches index your files accurately.
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
        setMetadata({
          title: '',
          author: '',
          subject: '',
          keywords: [],
          creator: '',
          producer: '',
        });
        setKeywordsInput('');
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleSaveMetadata}
      processButtonText="Save Updated PDF Metadata"
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF to view & edit metadata"
          subtitle="or drop document here"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tag className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-slate-900">Document Information Dictionary</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Document Title</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata((m) => ({ ...m, title: e.target.value }))}
                placeholder="e.g. Annual Financial Statement"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-brand focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Author / Organization</label>
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => setMetadata((m) => ({ ...m, author: e.target.value }))}
                placeholder="e.g. Jane Doe or DocuCraft Corp"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-brand focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-800">Subject / Description</label>
              <input
                type="text"
                value={metadata.subject}
                onChange={(e) => setMetadata((m) => ({ ...m, subject: e.target.value }))}
                placeholder="e.g. Summary report for board approval"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-brand focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-800">Keywords (Comma separated)</label>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="e.g. audit, finance, report, 2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-brand focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800">Application / Creator</label>
              <input
                type="text"
                value={metadata.creator}
                onChange={(e) => setMetadata((m) => ({ ...m, creator: e.target.value }))}
                placeholder="e.g. Microsoft Word or Adobe InDesign"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-brand focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800">PDF Producer Engine</label>
              <input
                type="text"
                value={metadata.producer}
                onChange={(e) => setMetadata((m) => ({ ...m, producer: e.target.value }))}
                placeholder="e.g. DocuCraft Engine"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-brand focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
