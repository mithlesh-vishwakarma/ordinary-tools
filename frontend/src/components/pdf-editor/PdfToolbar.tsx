import { DownloadIcon } from '../Icons';

interface PdfToolbarProps {
  fileName?: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  isExporting?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onUploadNew: () => void;
}

export default function PdfToolbar({
  fileName,
  currentPage,
  totalPages,
  zoom,
  canUndo,
  canRedo,
  isExporting = false,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onUndo,
  onRedo,
  onExport,
  onUploadNew,
}: PdfToolbarProps) {
  return (
    <div className="pdf-editor-toolbar glass-card">
      <div className="toolbar-left">
        {fileName ? (
          <div className="toolbar-file-info">
            <span className="file-badge">PDF</span>
            <span className="file-name" title={fileName}>{fileName}</span>
            <button onClick={onUploadNew} className="btn-link" title="Open a different PDF">
              Change
            </button>
          </div>
        ) : (
          <span className="toolbar-file-empty">No document loaded</span>
        )}
      </div>

      <div className="toolbar-center">
        {/* Page Navigation */}
        <div className="toolbar-group">
          <button 
            className="toolbar-btn" 
            onClick={onPrevPage} 
            disabled={currentPage <= 1 || totalPages === 0}
            title="Previous Page"
          >
            ‹
          </button>
          <span className="toolbar-page-indicator">
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : '- / -'}
          </span>
          <button 
            className="toolbar-btn" 
            onClick={onNextPage} 
            disabled={currentPage >= totalPages || totalPages === 0}
            title="Next Page"
          >
            ›
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Zoom Controls */}
        <div className="toolbar-group">
          <button 
            className="toolbar-btn" 
            onClick={onZoomOut} 
            disabled={zoom <= 50 || totalPages === 0}
            title="Zoom Out"
          >
            −
          </button>
          <span className="toolbar-zoom-indicator">{zoom}%</span>
          <button 
            className="toolbar-btn" 
            onClick={onZoomIn} 
            disabled={zoom >= 300 || totalPages === 0}
            title="Zoom In"
          >
            +
          </button>
          <button 
            className="toolbar-btn" 
            onClick={onFitWidth} 
            disabled={totalPages === 0}
            title="Fit Width"
          >
            Fit
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Undo / Redo */}
        <div className="toolbar-group">
          <button 
            className="toolbar-btn" 
            onClick={onUndo} 
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button 
            className="toolbar-btn" 
            onClick={onRedo} 
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>
      </div>

      <div className="toolbar-right">
        <button 
          className="btn btn--primary btn--small" 
          onClick={onExport} 
          disabled={totalPages === 0 || isExporting}
        >
          <DownloadIcon />
          <span>{isExporting ? 'Exporting PDF...' : 'Download PDF'}</span>
        </button>
      </div>
    </div>
  );
}
