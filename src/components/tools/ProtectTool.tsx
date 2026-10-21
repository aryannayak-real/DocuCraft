import React, { useState } from 'react';
import { UploadedFile, ToolDef, ProcessingState, ProtectSettings } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { protectPdf } from '../../utils/pdfOps';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { Lock, Eye, EyeOff, ShieldCheck, Printer, Copy, Edit3 } from 'lucide-react';

interface ProtectToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const ProtectTool: React.FC<ProtectToolProps> = ({ tool, onBack, initialFiles = [] }) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<ProtectSettings>({
    userPassword: '',
    ownerPassword: '',
    allowPrinting: true,
    allowCopying: true,
    allowModifying: false,
    algorithm: 'AES-256',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const handleFilesAdded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setValidationError(null);
    }
  };

  const handleProtect = async () => {
    if (!file) return;

    if (!settings.userPassword) {
      setValidationError('Please enter a password to protect this document.');
      return;
    }

    if (settings.userPassword !== confirmPassword) {
      setValidationError('Passwords do not match. Please re-enter.');
      return;
    }

    setValidationError(null);
    setProcessingState({
      status: 'processing',
      progress: 30,
      message: `Encrypting with ${settings.algorithm} security handler...`,
    });

    try {
      setProcessingState((p) => ({
        ...p,
        progress: 75,
        message: 'Applying permission flags and cryptographic key derivation...',
      }));

      const protectedBytes = await protectPdf(file.data, settings.userPassword, {
        ownerPassword: settings.ownerPassword || settings.userPassword,
        algorithm: settings.algorithm,
        allowPrinting: settings.allowPrinting,
        allowCopying: settings.allowCopying,
        allowModifying: settings.allowModifying,
      });

      const filename = `${file.name.replace(/\.pdf$/i, '')}_protected.pdf`;
      const blob = new Blob([protectedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(protectedBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'PDF successfully encrypted and protected!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: protectedBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('Protect error:', err);
      const errMsg = err instanceof Error ? err.message : 'Encryption failed';
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
        <label className="font-semibold text-slate-800">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={settings.userPassword}
            onChange={(e) => setSettings((s) => ({ ...s, userPassword: e.target.value }))}
            placeholder="Enter password to open file"
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

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Confirm Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-type password"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-brand outline-none"
        />
      </div>

      {validationError && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px]">
          {validationError}
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="font-semibold text-slate-800">Encryption Standard</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, algorithm: 'AES-256' }))}
            className={`p-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              settings.algorithm === 'AES-256'
                ? 'border-brand bg-brand-light/50 text-brand font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="font-bold">AES-256</div>
            <div className="text-[10px] text-slate-400">Maximum Security</div>
          </button>

          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, algorithm: 'RC4' }))}
            className={`p-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              settings.algorithm === 'RC4'
                ? 'border-brand bg-brand-light/50 text-brand font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="font-bold">RC4 (128-bit)</div>
            <div className="text-[10px] text-slate-400">Legacy Compatible</div>
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="font-semibold text-slate-800">Permissions for Viewers</label>
        <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowPrinting}
            onChange={(e) => setSettings((s) => ({ ...s, allowPrinting: e.target.checked }))}
            className="accent-brand"
          />
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Allow Printing</span>
        </label>

        <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowCopying}
            onChange={(e) => setSettings((s) => ({ ...s, allowCopying: e.target.checked }))}
            className="accent-brand"
          />
          <Copy className="w-3.5 h-3.5 text-slate-500" />
          <span>Allow Text / Image Copying</span>
        </label>

        <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowModifying}
            onChange={(e) => setSettings((s) => ({ ...s, allowModifying: e.target.checked }))}
            className="accent-brand"
          />
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          <span>Allow Document Editing</span>
        </label>
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        setFile(null);
        setSettings({
          userPassword: '',
          ownerPassword: '',
          allowPrinting: true,
          allowCopying: true,
          allowModifying: false,
          algorithm: 'AES-256',
        });
        setConfirmPassword('');
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleProtect}
      processButtonText="Protect PDF"
      isProcessDisabled={!settings.userPassword || settings.userPassword !== confirmPassword}
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF file to protect"
          subtitle="or drop PDF document here"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-light text-brand mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">{file.name}</h3>
            <p className="text-xs text-slate-500">
              {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} ready to encrypt
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl text-left text-xs text-slate-600 max-w-md mx-auto space-y-2 border border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Standard Military-Grade Client Encryption</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Encryption is calculated locally using Web Crypto and the PDF 2.0 AES-256 standard. Your password is never transmitted across the network.
            </p>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
