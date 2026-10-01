import { useEffect, useRef, useState } from 'react';
import { 
  renderPageToCanvas, 
  cancelCanvasRender, 
  isRenderingCancelledError, 
  type PdfDoc 
} from './pdfRenderer';

interface PdfViewerProps {
  pdfDoc: PdfDoc | null;
  currentPage: number;
  zoom: number;
  onPageDimensionsChange?: (dimensions: { width: number; height: number }) => void;
}

export default function PdfViewer({
  pdfDoc,
  currentPage,
  zoom,
  onPageDimensionsChange,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pdfDoc || !canvas) return;

    let isCancelled = false;
    setIsRendering(true);
    setRenderError(null);

    const scale = zoom / 100;

    renderPageToCanvas(pdfDoc, currentPage, canvas, scale)
      .then((dims) => {
        if (!isCancelled) {
          setIsRendering(false);
          if (onPageDimensionsChange) {
            onPageDimensionsChange({ width: dims.width, height: dims.height });
          }
        }
      })
      .catch((err) => {
        if (isRenderingCancelledError(err)) {
          // Normal cancellation caused by rapid zooming/page change or React remounting
          return;
        }
        if (!isCancelled) {
          console.error('PDF rendering failed:', err);
          setIsRendering(false);
          setRenderError(err?.message || 'Failed to render PDF page.');
        }
      });

    return () => {
      isCancelled = true;
      cancelCanvasRender(canvas);
    };
  }, [pdfDoc, currentPage, zoom, onPageDimensionsChange]);

  return (
    <div className="pdf-viewer-canvas-wrapper">
      {isRendering && (
        <div className="canvas-render-spinner">
          <div className="spinner-dot" />
          <span>Rendering page {currentPage}...</span>
        </div>
      )}

      {renderError && (
        <div className="canvas-render-error glass-card">
          <span>⚠️ {renderError}</span>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        className="pdf-main-canvas"
      />
    </div>
  );
}
