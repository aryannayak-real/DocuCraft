import React, { useState, useMemo, useEffect } from 'react';
import { TOOLS } from './data/tools';
import { ToolCategory, UploadedFile } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import { AboutModal } from './components/dialogs/AboutModal';
import { TermsModal } from './components/dialogs/TermsModal';
import { HelpModal } from './components/dialogs/HelpModal';
import { HomeDropActionModal } from './components/dialogs/HomeDropActionModal';
import { createSamplePdf } from './utils/pdfOps';
import { getPdfPageCount, renderPdfThumbnail } from './utils/pdfRenderer';
import {
  getFavoriteToolIds,
  toggleFavoriteToolId,
  getRecentToolIds,
  recordRecentToolId,
  clearUserActivityPreferences,
} from './utils/storage';

// Existing Tools
import { MergeTool } from './components/tools/MergeTool';
import { SplitTool } from './components/tools/SplitTool';
import { OrganizeTool } from './components/tools/OrganizeTool';
import { RotateTool } from './components/tools/RotateTool';
import { ImageToPdfTool } from './components/tools/ImageToPdfTool';
import { PdfToImageTool } from './components/tools/PdfToImageTool';
import { WebpageToPdfTool } from './components/tools/WebpageToPdfTool';
import { PageNumbersTool } from './components/tools/PageNumbersTool';
import { WatermarkTool } from './components/tools/WatermarkTool';
import { CompressTool } from './components/tools/CompressTool';
import { OcrTool } from './components/tools/OcrTool';

// New Upgraded Tools
import { ProtectTool } from './components/tools/ProtectTool';
import { UnlockTool } from './components/tools/UnlockTool';
import { PdfToWordTool } from './components/tools/PdfToWordTool';
import { PdfToExcelTool } from './components/tools/PdfToExcelTool';
import { CompareTool } from './components/tools/CompareTool';
import { ExtractPagesTool } from './components/tools/ExtractPagesTool';
import { ExtractTextTool } from './components/tools/ExtractTextTool';
import { MetadataTool } from './components/tools/MetadataTool';
import { RepairTool } from './components/tools/RepairTool';
import { AnnotateTool } from './components/tools/AnnotateTool';

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Local storage favorites and recents
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);

  // File passed between home and active tool
  const [sampleFiles, setSampleFiles] = useState<UploadedFile[]>([]);
  const [homeDroppedFiles, setHomeDroppedFiles] = useState<UploadedFile[] | null>(null);

  useEffect(() => {
    setFavoriteIds(getFavoriteToolIds());
    setRecentToolIds(getRecentToolIds());
  }, []);

  const handleToggleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    const updated = toggleFavoriteToolId(toolId);
    setFavoriteIds(updated);
  };

  const handleClearRecentHistory = () => {
    clearUserActivityPreferences();
    setRecentToolIds([]);
    setFavoriteIds([]);
  };

  const handleSelectTool = (toolId: string) => {
    setActiveToolId(toolId);
    const updated = recordRecentToolId(toolId);
    setRecentToolIds(updated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setActiveToolId(null);
    setSampleFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickSample = async () => {
    try {
      const sampleBytes = await createSamplePdf();
      const sampleBlob = new Blob([sampleBytes as unknown as BlobPart], { type: 'application/pdf' });
      const sampleFile = new File([sampleBlob], 'DocuCraft_Sample_Report.pdf', {
        type: 'application/pdf',
      });
      const pageCount = await getPdfPageCount(sampleBytes);
      const thumb = await renderPdfThumbnail(sampleBytes, 1, 200);

      const uploaded: UploadedFile = {
        id: `sample-quick-${Date.now()}`,
        file: sampleFile,
        name: 'DocuCraft_Sample_Report.pdf',
        size: sampleBytes.byteLength,
        data: sampleBytes,
        pageCount,
        pages: [
          {
            pageIndex: 0,
            pageNumber: 1,
            thumbnailUrl: thumb,
            rotation: 0,
          },
        ],
      };

      setSampleFiles([uploaded]);
      handleSelectTool('watermark');
    } catch (err) {
      console.error('Failed to quick launch sample:', err);
      handleSelectTool('watermark');
    }
  };

  const handleFileDroppedOnHome = (files: UploadedFile[]) => {
    setHomeDroppedFiles(files);
  };

  const handleSelectToolForHomeFiles = (toolId: string) => {
    if (homeDroppedFiles) {
      setSampleFiles(homeDroppedFiles);
      setHomeDroppedFiles(null);
      handleSelectTool(toolId);
    }
  };

  // Filter tools
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all'
          ? true
          : activeCategory === 'favorites'
          ? favoriteIds.includes(tool.id)
          : tool.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        tool.name.toLowerCase().includes(q) ||
        tool.shortDesc.toLowerCase().includes(q) ||
        tool.longDesc.toLowerCase().includes(q) ||
        tool.id.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, favoriteIds]);

  const currentTool = useMemo(() => {
    return TOOLS.find((t) => t.id === activeToolId) || null;
  }, [activeToolId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-brand-light selection:text-brand">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveToolId(null);
        }}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onHomeClick={handleGoHome}
        onQuickSample={handleQuickSample}
        favoriteCount={favoriteIds.length}
        onFilterFavorites={() => {
          setActiveCategory('favorites');
          setActiveToolId(null);
        }}
        isFavoritesActive={activeCategory === 'favorites' && activeToolId === null}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!activeToolId ? (
          <>
            <Hero
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onFileDroppedOnHome={handleFileDroppedOnHome}
              favoriteCount={favoriteIds.length}
            />

            <ToolGrid
              tools={filteredTools}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              onSelectTool={handleSelectTool}
              onClearSearch={() => setSearchQuery('')}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              recentToolIds={recentToolIds}
              onClearRecentHistory={handleClearRecentHistory}
            />
          </>
        ) : (
          <div className="min-h-[75vh]">
            {currentTool && (
              <>
                {/* Organize & Manage */}
                {currentTool.id === 'merge' && (
                  <MergeTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'split' && (
                  <SplitTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'organize' && (
                  <OrganizeTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'rotate' && (
                  <RotateTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'extract-pages' && (
                  <ExtractPagesTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}

                {/* Convert */}
                {currentTool.id === 'image-to-pdf' && (
                  <ImageToPdfTool tool={currentTool} onBack={handleGoHome} />
                )}
                {currentTool.id === 'pdf-to-image' && (
                  <PdfToImageTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'pdf-to-word' && (
                  <PdfToWordTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'pdf-to-excel' && (
                  <PdfToExcelTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'html-to-pdf' && (
                  <WebpageToPdfTool tool={currentTool} onBack={handleGoHome} />
                )}

                {/* Security */}
                {currentTool.id === 'protect' && (
                  <ProtectTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'unlock' && (
                  <UnlockTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}

                {/* Edit & Annotate */}
                {currentTool.id === 'watermark' && (
                  <WatermarkTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'page-numbers' && (
                  <PageNumbersTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'annotate' && (
                  <AnnotateTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}

                {/* Optimize, Extract & Compare */}
                {currentTool.id === 'compress' && (
                  <CompressTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'extract-text' && (
                  <ExtractTextTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'ocr' && (
                  <OcrTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'compare' && (
                  <CompareTool tool={currentTool} onBack={handleGoHome} />
                )}
                {currentTool.id === 'metadata' && (
                  <MetadataTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
                {currentTool.id === 'repair' && (
                  <RepairTool tool={currentTool} onBack={handleGoHome} initialFiles={sampleFiles} />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveToolId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onSelectTool={handleSelectTool}
      />

      {/* Dialog Modals */}
      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onSelectTool={(id) => {
          setIsHelpModalOpen(false);
          handleSelectTool(id);
        }}
      />

      {/* Homepage file dropped smart action modal */}
      <HomeDropActionModal
        files={homeDroppedFiles}
        onClose={() => setHomeDroppedFiles(null)}
        onSelectToolForFiles={handleSelectToolForHomeFiles}
      />
    </div>
  );
}
