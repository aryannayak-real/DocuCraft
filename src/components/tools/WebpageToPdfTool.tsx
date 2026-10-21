import React, { useState, useRef } from 'react';
import { ToolDef, ProcessingState } from '../../types';
import { ToolLayout } from '../ToolLayout';
import { convertHtmlElementToPdf } from '../../utils/htmlToPdf';
import { downloadUint8Array } from '../../utils/downloadHelper';
import { FileText, Layout, Sparkles } from 'lucide-react';

interface WebpageToPdfToolProps {
  tool: ToolDef;
  onBack: () => void;
}

const TEMPLATES = {
  brief: {
    title: 'Project Proposal & Technical Specifications',
    category: 'Engineering Architecture',
    body: `<h1>Project Architecture & Implementation Brief</h1>
<p class="lead">Document Version 2.4 · Prepared for Enterprise Evaluation</p>
<hr/>
<h2>1. Executive Summary</h2>
<p>This document details the transition towards high-performance client-side document processing architectures. By utilizing WebAssembly modules and Web Workers, modern client applications can achieve zero-latency PDF rendering and cryptographic transformations directly on client hardware.</p>

<h2>2. Core System Advantages</h2>
<ul>
  <li><strong>Complete Confidentiality:</strong> Data never leaves the client boundary; zero third-party cloud data transmission.</li>
  <li><strong>Instantaneous Execution:</strong> Microsecond pipeline execution without round-trip network hops.</li>
  <li><strong>Zero Hosting Bandwidth:</strong> Client devices supply computational horsepower.</li>
</ul>

<h2>3. Authorization & Acceptance</h2>
<p>Approved and verified by the Technical Operations Board.</p>`,
  },
  invoice: {
    title: 'Professional Service Invoice',
    category: 'Finance & Billing',
    body: `<div style="display:flex; justify-content:space-between; align-items:flex-start;">
  <div>
    <h1 style="margin:0; font-size:24px;">INVOICE #INV-2026-089</h1>
    <p style="color:#64748b; margin:4px 0;">Issued Date: October 2026 · Due in 30 Days</p>
  </div>
  <div style="text-align:right;">
    <strong style="font-size:16px;">DocuCraft Services Ltd.</strong><br/>
    <span style="color:#64748b; font-size:12px;">Enterprise Solutions Division</span>
  </div>
</div>
<hr style="margin:20px 0; border:0; border-top:1px solid #e2e8f0;"/>
<table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:13px;">
  <thead>
    <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1; text-align:left;">
      <th style="padding:10px;">Item & Scope</th>
      <th style="padding:10px; text-align:right;">Qty</th>
      <th style="padding:10px; text-align:right;">Rate</th>
      <th style="padding:10px; text-align:right;">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:10px;"><strong>Client-Side PDF Architecture Audit</strong><br/><span style="color:#64748b; font-size:11px;">Complete security verification</span></td>
      <td style="padding:10px; text-align:right;">1</td>
      <td style="padding:10px; text-align:right;">$1,850.00</td>
      <td style="padding:10px; text-align:right;">$1,850.00</td>
    </tr>
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:10px;"><strong>Tesseract OCR Neural Model Integration</strong><br/><span style="color:#64748b; font-size:11px;">Web Worker client engine</span></td>
      <td style="padding:10px; text-align:right;">1</td>
      <td style="padding:10px; text-align:right;">$1,200.00</td>
      <td style="padding:10px; text-align:right;">$1,200.00</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="3" style="padding:12px 10px; text-align:right; font-weight:bold;">Total Amount Due:</td>
      <td style="padding:12px 10px; text-align:right; font-weight:bold; font-size:15px; color:#2563eb;">$3,050.00</td>
    </tr>
  </tfoot>
</table>`,
  },
  minutes: {
    title: 'Executive Minutes & Decisions',
    category: 'Corporate Governance',
    body: `<h1>Quarterly Strategy Session Minutes</h1>
<p style="color:#64748b;">Attendees: Lead Architect, Product Director, Security Officer</p>
<hr/>
<h3>Key Decisions Agreed:</h3>
<ol>
  <li><strong>Full Client Processing Mandate:</strong> All file conversions will stay client-side. No user files stored on databases.</li>
  <li><strong>Standardized Tooling:</strong> Support Merge, Split, Watermark, Compress, and OCR as foundational utilities.</li>
  <li><strong>Public Release:</strong> Launch public web version with zero-friction trial sample.</li>
</ol>`,
  },
};

export const WebpageToPdfTool: React.FC<WebpageToPdfToolProps> = ({ tool, onBack }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('brief');
  const [contentHtml, setContentHtml] = useState(TEMPLATES.brief.body);
  const [orientation, setOrientation] = useState<'p' | 'l'>('p');
  const [documentTitle, setDocumentTitle] = useState('Webpage_Document');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const previewRef = useRef<HTMLDivElement>(null);

  const handleApplyTemplate = (key: keyof typeof TEMPLATES) => {
    setSelectedTemplate(key);
    setContentHtml(TEMPLATES[key].body);
    setDocumentTitle(TEMPLATES[key].title.replace(/\s+/g, '_'));
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;

    setProcessingState({
      status: 'processing',
      progress: 35,
      message: 'Rendering DOM layout to vector canvas...',
    });

    try {
      setProcessingState((p) => ({ ...p, progress: 70, message: 'Compiling PDF document...' }));

      const pdfBytes = await convertHtmlElementToPdf(previewRef.current, {
        orientation,
        format: 'a4',
        scale: 2,
      });

      const filename = `${documentTitle}_${Date.now()}.pdf`;
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      downloadUint8Array(pdfBytes, filename);

      setProcessingState({
        status: 'success',
        progress: 100,
        message: 'PDF exported successfully!',
        resultUrl: url,
        resultFileName: filename,
        resultSize: pdfBytes.byteLength,
      });
    } catch (err: unknown) {
      console.error('HTML to PDF export error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to export PDF';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: errMsg,
      });
    }
  };

  const settingsContent = (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Choose Template</label>
        <div className="space-y-1.5">
          {(
            [
              { id: 'brief', name: 'Executive Proposal' },
              { id: 'invoice', name: 'Service Invoice' },
              { id: 'minutes', name: 'Meeting Minutes' },
            ] as const
          ).map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleApplyTemplate(tmpl.id)}
              className={`w-full p-2.5 rounded-lg border text-left font-medium flex items-center justify-between transition-colors cursor-pointer ${
                selectedTemplate === tmpl.id
                  ? 'border-brand bg-brand-light/50 text-brand font-bold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span>{tmpl.name}</span>
              {selectedTemplate === tmpl.id && <Sparkles className="w-3.5 h-3.5 text-brand" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Page Orientation</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOrientation('p')}
            className={`py-2 px-3 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              orientation === 'p'
                ? 'border-brand bg-brand-light/50 text-brand font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Portrait (A4)
          </button>
          <button
            type="button"
            onClick={() => setOrientation('l')}
            className={`py-2 px-3 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              orientation === 'l'
                ? 'border-brand bg-brand-light/50 text-brand font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Landscape (A4)
          </button>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
        <div className="font-bold text-slate-900">Remote URL & CORS Limitations</div>
        <p className="text-[11px] leading-relaxed">
          Standard browser security policies (CORS) prohibit client scripts from directly scraping and fetching arbitrary remote websites (e.g. google.com) without cross-origin authorization. Paste or edit your formatted HTML/text directly above for guaranteed high-fidelity vector rendering.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-slate-800">Output File Title</label>
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:border-blue-500 outline-none"
        />
      </div>
    </div>
  );

  return (
    <ToolLayout
      tool={tool}
      onBack={onBack}
      onReset={() => {
        handleApplyTemplate('brief');
        setProcessingState({ status: 'idle', progress: 0, message: '' });
      }}
      processingState={processingState}
      hasFiles={true}
      onProcess={handleExportPdf}
      processButtonText="Convert Webpage to PDF"
      settingsContent={settingsContent}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">
            Live Interactive Document Canvas (Edit text directly or modify HTML source below)
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Layout className="w-3.5 h-3.5" />
            <span>High-Fidelity Print Renderer</span>
          </span>
        </div>

        {/* Printable Canvas Frame */}
        <div className="bg-slate-200/70 p-4 sm:p-8 rounded-2xl flex justify-center shadow-inner overflow-x-auto">
          <div
            ref={previewRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setContentHtml(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            className={`bg-white text-slate-900 p-10 sm:p-14 shadow-lg rounded-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 prose prose-slate max-w-none ${
              orientation === 'l' ? 'w-[750px] min-h-[500px]' : 'w-[560px] min-h-[750px]'
            }`}
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* HTML Source Code Toggle */}
        <details className="bg-white border border-slate-200 rounded-xl p-4 text-xs">
          <summary className="font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>View / Edit Raw HTML Code</span>
          </summary>
          <div className="mt-3">
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={8}
              className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
        </details>
      </div>
    </ToolLayout>
  );
};
