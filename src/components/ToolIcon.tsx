import React from 'react';
import {
  Combine,
  Scissors,
  LayoutGrid,
  RotateCw,
  Image,
  FileImage,
  Globe,
  Hash,
  Stamp,
  Minimize2,
  ScanText,
  FileText,
  Layers,
  Table,
  Lock,
  Unlock,
  PenTool,
  FileCode,
  GitCompare,
  Tag,
  Wrench,
} from 'lucide-react';

interface ToolIconProps {
  name: string;
  className?: string;
}

export const ToolIcon: React.FC<ToolIconProps> = ({ name, className = 'w-6 h-6' }) => {
  switch (name) {
    case 'Combine':
      return <Combine className={className} />;
    case 'Scissors':
      return <Scissors className={className} />;
    case 'LayoutGrid':
      return <LayoutGrid className={className} />;
    case 'RotateCw':
      return <RotateCw className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Image':
      return <Image className={className} />;
    case 'FileImage':
      return <FileImage className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Table':
      return <Table className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Lock':
      return <Lock className={className} />;
    case 'Unlock':
      return <Unlock className={className} />;
    case 'Hash':
      return <Hash className={className} />;
    case 'Stamp':
      return <Stamp className={className} />;
    case 'PenTool':
      return <PenTool className={className} />;
    case 'Minimize2':
      return <Minimize2 className={className} />;
    case 'FileCode':
      return <FileCode className={className} />;
    case 'ScanText':
      return <ScanText className={className} />;
    case 'GitCompare':
      return <GitCompare className={className} />;
    case 'Tag':
      return <Tag className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    default:
      return <FileText className={className} />;
  }
};
