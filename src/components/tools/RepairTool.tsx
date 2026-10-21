import React, { useState } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { diagnoseAndRepairPdf } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { Wrench, Terminal, CheckCircle2 } from 'lucide-react';

interface RepairToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const RepairTool: React.FC<RepairToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [repairLog, setRepairLog] = useState<string[]>([]);
  const [recoveredCount, setRecoveredCount] = useState<number>(0);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setRepairLog([]);
    }
  };

  const handleRepair = async () => {
    if (!file) return;

    setProcessingState({
      status: 'processing',
      progress: 25,
      message: 'Running binary structure inspection...',
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 60,
        message: 'Rebuilding cross-reference table and normalizing object streams...',
      }));

      const res = await diagnoseAndRepairPdf(file.data);
      setRepairLog(res.log);
      setRecoveredCount(res.pagesRecovered);

      const filename = `${file.name.replace(/\.pdf$/i, '')}_repaired.pdf`;
      const blob = new Blob([res.repairedData as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(res.repairedData, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'PDF structural repair complete!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: res.repairedData.byteLength,
      });
    } catch (err: unknown) {
      console.error('Repair error:', err);
      const errMsg = err instanceof Error ? err.message : 'PDF is too severely corrupted to recover';
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
          <Wrench className="w-3.5 h-3.5 text-brand" />
          <span>Diagnostic Engine</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Analyzes binary headers, identifies missing stream trailers, and re-indexes pages into a clean, standard conforming PDF container.
        </p>
      </div>

      {recoveredCount > 0 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{recoveredCount} pages verified and normalized</span>
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setRepairLog([]);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleRepair}
      processButtonText="Diagnose & Repair PDF"
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select damaged or unreadable PDF"
          subtitle="or drop document here to diagnose & repair"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">Diagnostic & Recovery Console</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">{file.name}</span>
          </div>

          <div className="bg-slate-900 text-slate-100 font-mono text-xs rounded-xl p-5 min-h-[260px] max-h-[400px] overflow-y-auto space-y-1.5">
            <div className="text-slate-400">DocuCraft PDF Diagnostic Engine v2.0</div>
            <div className="text-slate-400">Ready to inspect document cross-reference streams...</div>
            {repairLog.map((line, idx) => (
              <div key={idx} className="text-emerald-400 flex items-start gap-1.5">
                <span className="text-slate-500 select-none">&gt;</span>
                <span>{line}</span>
              </div>
            ))}
            {repairLog.length === 0 && (
              <div className="text-slate-500 pt-4 italic">
                Click &ldquo;Diagnose & Repair PDF&rdquo; on the right to begin diagnostic execution.
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
