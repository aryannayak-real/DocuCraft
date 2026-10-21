import React, { useState } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { unlockPdf } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { Unlock, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface UnlockToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const UnlockTool: React.FC<UnlockToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setErrorMessage(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;

    setErrorMessage(null);
    setProcessingState({
      status: 'processing',
      progress: 35,
      message: 'Decrypting document security handler...',
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 75,
        message: 'Removing encryption dictionary and permissions...',
      }));

      const unlockedBytes = await unlockPdf(file.data, password);
      const filename = `${file.name.replace(/\.pdf$/i, '')}_unlocked.pdf`;
      const blob = new Blob([unlockedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(unlockedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'PDF successfully unlocked and saved!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: unlockedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Unlock error:', err);
      const errMsg = err instanceof Error ? err.message : 'Invalid password or unsupported encryption';
      setErrorMessage('Could not decrypt document. Please verify the password is correct.');
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
        <label className="font-semibold text-slate-800">Document Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-brand outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px]">
          {errorMessage}
        </div>
      )}

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Security Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          DocuCraft only removes security from PDFs you are authorized to open. If your PDF has no password but restricts printing or copying, leaving the password blank will remove those restrictions.
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
        setPassword('');
        setErrorMessage(null);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleUnlock}
      processButtonText="Unlock PDF"
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select protected PDF to unlock"
          subtitle="or drop document here"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
            <Unlock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">{file.name}</h3>
            <p className="text-xs text-slate-500">Ready to remove encryption and restrictions</p>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
