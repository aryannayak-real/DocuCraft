import React, { useState, useEffect } from 'react';
import { UploadedFile, ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { Dropzone } from '../Dropzone';
import { extractDigitalTextFromPdf } from '../../utils/textExtractor';
import { extractTablesToSpreadsheet, SpreadsheetExportResult } from '../../utils/excelExport';
import { downloadBlob } from '../../utils/downloadHelper';
import { Table, FileSpreadsheet, Download, Sparkles } from 'lucide-react';

interface PdfToExcelToolProps {
  tool: ToolDef;
  onBack: () => void;
  initialFiles?: UploadedFile[];
}

export const PdfToExcelTool: React.FC<PdfToExcelToolProps> = ({
  tool,
  onBack,
  initialFiles = [],
}) => {
  const [file, setFile] = useState<UploadedFile | null>(initialFiles[0] || null);
  const [exportResult, setExportResult] = useState<SpreadsheetExportResult | null>(null);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    if (!file) {
      setExportResult(null);
      return;
    }

    let isSubscribed = true;

    extractDigitalTextFromPdf(file.data).then((extracted) => {
      if (isSubscribed) {
        const res = extractTablesToSpreadsheet(extracted.pages);
        setExportResult(res);
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

  const handleExport = () => {
    if (!file || !exportResult) return;

    setProcessingState({
      status: 'processing',
      progress: 50,
      message: `Generating ${exportFormat.toUpperCase()} spreadsheet format...`,
    });

    try {
      if (exportFormat === 'xlsx') {
        const filename = `${file.name.replace(/\.pdf$/i, '')}.xlsx`;
        const url = URL.createObjectURL(exportResult.xlsxBlob);
        downloadBlob(exportResult.xlsxBlob, filename);

        setProcessingState({
          status: 'success',
          progress: 100,
          message: 'Excel spreadsheet exported!',
          resultUrl: url,
          resultFileName: filename,
          resultSize: exportResult.xlsxBlob.size,
        });
      } else {
        const filename = `${file.name.replace(/\.pdf$/i, '')}.csv`;
        const csvBlob = new Blob([exportResult.csvString], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(csvBlob);
        downloadBlob(csvBlob, filename);

        setProcessingState({
          status: 'success',
          progress: 100,
          message: 'CSV file exported!',
          resultUrl: url,
          resultFileName: filename,
          resultSize: csvBlob.size,
        });
      }
    } catch (err: unknown) {
      console.error('Spreadsheet export error:', err);
      const errMsg = err instanceof Error ? err.message : 'Export failed';
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
        <label className="font-semibold text-slate-800">Format</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setExportFormat('xlsx')}
            className={`p-2.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              exportFormat === 'xlsx'
                ? 'border-brand bg-brand-light/50 text-brand font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Workbook</div>
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('csv')}
            className={`p-2.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              exportFormat === 'csv'
                ? 'border-brand bg-brand-light/50 text-brand font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Table className="w-4 h-4" />
              <span>CSV (.csv)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Plain text</div>
          </button>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>Table Detection</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The parser identifies column delimiters, multi-space aligned columns, and financial rows. Scanned raster tables may require OCR first.
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
        setExportResult(null);
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={file !== null}
      onProcess={handleExport}
      processButtonText={`Export Table Data (${exportResult?.totalRows || 0} rows)`}
      settingsContent={settingsContent}
      activeFile={file}
    >
      {!file ? (
        <Dropzone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          title="Select PDF containing tables or rows"
          subtitle="or drop document here to extract to Excel"
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Extracted Spreadsheet Table Preview</h3>
                  <p className="text-[11px] text-slate-400">
                    Previewing first {exportResult?.previewRows.length || 0} rows of {exportResult?.totalRows || 0} detected rows
                  </p>
                </div>
              </div>

              {exportResult && (
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download {exportFormat.toUpperCase()}</span>
                </button>
              )}
            </div>

            {/* Interactive Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[440px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    {exportResult?.previewRows[0]?.map((col, idx) => (
                      <th key={idx} className="p-2.5 font-bold border-r border-slate-200 last:border-r-0 truncate max-w-[200px]">
                        {col || `Col ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {exportResult && exportResult.previewRows.length > 1 ? (
                    exportResult.previewRows.slice(1).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-2.5 text-slate-800 border-r border-slate-100 last:border-r-0 truncate max-w-[220px]"
                            title={cell}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Analyzing table structure...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
