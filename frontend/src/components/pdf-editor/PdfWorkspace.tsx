import React, { useState } from 'react';
import { PdfIcon } from '../Icons';
import type { PdfDoc } from './pdfRenderer';
import type { EditorObject } from './types';
import PdfThumbnailItem from './PdfThumbnailItem';
import PdfPropertiesPanel from './PdfPropertiesPanel';

export type ToolType = 
  | 'select' 
  | 'text' 
  | 'image' 
  | 'draw' 
  | 'highlight' 
  | 'shape' 
  | 'signature' 
  | 'watermark' 
  | 'redact';

interface PdfWorkspaceProps {
  docId?: string;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  currentPage: number;
  totalPages: number;
  pdfDoc: PdfDoc | null;
  isLoading: boolean;
  errorMessage: string | null;
  selectedObject: EditorObject | null;
  onUploadClick: () => void;
  onFileDrop: (file: File) => void;
  onPageChange: (page: number) => void;
  onUpdateObject: (updated: EditorObject) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  children?: React.ReactNode;
}

export default function PdfWorkspace({
  docId,
  activeTool,
  onSelectTool,
  currentPage,
  totalPages,
  pdfDoc,
  isLoading,
  errorMessage,
  selectedObject,
  onUploadClick,
  onFileDrop,
  onPageChange,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
  children
}: PdfWorkspaceProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const toolsList: { id: ToolType; label: string; icon: string }[] = [
    { id: 'select', label: 'Select', icon: '↖' },
    { id: 'text', label: 'Text', icon: 'T' },
    { id: 'image', label: 'Image', icon: '🖼' },
    { id: 'draw', label: 'Draw', icon: '✎' },
    { id: 'highlight', label: 'Highlight', icon: '🖍' },
    { id: 'shape', label: 'Shape', icon: '▢' },
    { id: 'signature', label: 'Signature', icon: '✍' },
    { id: 'watermark', label: 'Watermark', icon: '💧' },
    { id: 'redact', label: 'Redact', icon: '⬛' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="pdf-editor-workspace">
      {/* 1. LEFT TOOLS PALETTE */}
      <aside className="workspace-tools-panel glass-card">
        <div className="panel-section-title">Tools</div>
        <div className="tools-button-group">
          {toolsList.map((tool) => (
            <button
              key={tool.id}
              className={`workspace-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => onSelectTool(tool.id)}
              title={tool.label}
              disabled={!pdfDoc || isLoading}
            >
              <span className="tool-btn-icon">{tool.icon}</span>
              <span className="tool-btn-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* 2. CENTER CANVAS WORKSPACE */}
      <main 
        className={`workspace-center-canvas ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="pdf-loading-state glass-card">
            <div className="spinner-dot pulse-animation" />
            <h3>Processing PDF...</h3>
            <p>Loading document and preparing pages</p>
          </div>
        ) : errorMessage ? (
          <div className="pdf-error-state glass-card">
            <span className="error-icon">⚠️</span>
            <h3>Error Loading Document</h3>
            <p>{errorMessage}</p>
            <button onClick={onUploadClick} className="btn btn--secondary btn--small" style={{ marginTop: '12px' }}>
              Try Another File
            </button>
          </div>
        ) : pdfDoc ? (
          <div className="pdf-canvas-container">
            {children}
          </div>
        ) : (
          <div className="pdf-upload-empty-state glass-card" onClick={onUploadClick}>
            <div className="empty-upload-icon">
              <PdfIcon />
            </div>
            <h2>Upload a PDF Document</h2>
            <p>Drag and drop your PDF here, or click to browse files from your computer</p>
            <div className="upload-limits-note">Supports PDF files up to 50MB</div>
            <button className="btn btn--primary" style={{ marginTop: '16px' }}>
              Choose PDF File
            </button>
          </div>
        )}
      </main>

      {/* 3. RIGHT PROPERTIES PANEL */}
      <PdfPropertiesPanel
        selectedObject={selectedObject}
        onUpdateObject={onUpdateObject}
        onDeleteSelected={onDeleteSelected}
        onDuplicateSelected={onDuplicateSelected}
      />

      {/* 4. BOTTOM THUMBNAILS BAR */}
      {pdfDoc && totalPages > 0 && (
        <footer className="workspace-thumbnails-bar glass-card">
          <div className="thumbnails-scroll-container">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <PdfThumbnailItem
                key={`${docId || 'pdf'}-thumb-${idx + 1}`}
                pdfDoc={pdfDoc}
                pageNumber={idx + 1}
                isActive={currentPage === idx + 1}
                onClick={() => onPageChange(idx + 1)}
              />
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
