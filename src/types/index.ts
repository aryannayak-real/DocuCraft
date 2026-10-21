export type ToolCategory = 'organize' | 'convert' | 'edit' | 'security';

export interface ToolDef {
  id: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: ToolCategory;
  iconName: string;
  color: string;
  textColor: string;
  popular?: boolean;
  isNew?: boolean;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  data: Uint8Array;
  pageCount: number;
  dimensions?: { width: number; height: number };
  pages?: PdfPageThumbnail[];
}

export interface PdfPageThumbnail {
  pageIndex: number; // 0-based
  pageNumber: number; // 1-based
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
  selected?: boolean;
  isDeleted?: boolean;
}

export interface WatermarkSettings {
  text: string;
  opacity: number; // 0.1 - 1
  rotation: number; // -90 to 90
  fontSize: number;
  color: string; // hex #rrggbb
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';
}

export interface PageNumberSettings {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  format: 'page_of_n' | 'n_of_n' | 'page_n' | 'n_only';
  startNumber: number;
  fontSize: number;
  color: string;
  margin: number;
}

export interface SplitSettings {
  mode: 'range' | 'extract_all' | 'custom_pages';
  rangeText: string;
  selectedPages: number[];
}

export interface ImageToPdfSettings {
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 'none' | 'small' | 'normal';
  pageSize: 'a4' | 'letter' | 'fit';
}

export interface PdfToImageSettings {
  format: 'jpeg' | 'png';
  quality: number; // 0.6 - 1.0
  scale: number; // 1 to 3
}

export interface CompressSettings {
  level: 'recommended' | 'extreme' | 'low';
}

export interface ProtectSettings {
  userPassword: string;
  ownerPassword?: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
  algorithm: 'AES-256' | 'RC4';
}

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface AnnotationItem {
  id: string;
  pageNumber: number; // 1-based
  type: 'text' | 'highlight' | 'rectangle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  opacity: number;
}

export interface ComparisonDiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface PageComparisonDiff {
  pageNumber: number;
  status: 'identical' | 'modified' | 'only_in_a' | 'only_in_b';
  textDiffs: ComparisonDiffPart[];
}

export interface ComparisonReport {
  fileAName: string;
  fileBName: string;
  pageCountA: number;
  pageCountB: number;
  similarityScore: number; // 0 - 100%
  pageDiffs: PageComparisonDiff[];
  summary: {
    identicalPages: number;
    modifiedPages: number;
    addedLines: number;
    removedLines: number;
  };
}

export interface ProcessingState {
  status: 'idle' | 'loading' | 'processing' | 'success' | 'error';
  progress: number; // 0 to 100
  indeterminate?: boolean;
  message: string;
  resultUrl?: string;
  resultFileName?: string;
  resultSize?: number;
  originalSize?: number;
}

export interface RecentTool {
  id: string;
  timestamp: number;
}
