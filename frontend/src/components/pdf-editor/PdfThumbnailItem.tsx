import { useEffect, useRef } from 'react';
import { 
  renderPageThumbnail, 
  cancelCanvasRender, 
  isRenderingCancelledError, 
  type PdfDoc 
} from './pdfRenderer';

interface PdfThumbnailItemProps {
  pdfDoc: PdfDoc;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}

export default function PdfThumbnailItem({
  pdfDoc,
  pageNumber,
  isActive,
  onClick,
}: PdfThumbnailItemProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfDoc) return;
    let isCancelled = false;

    renderPageThumbnail(pdfDoc, pageNumber, canvas, 60).catch((err) => {
      if (isRenderingCancelledError(err)) {
        return;
      }
      if (!isCancelled) {
        console.warn(`Thumbnail rendering error for page ${pageNumber}:`, err);
      }
    });

    return () => {
      isCancelled = true;
      cancelCanvasRender(canvas);
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div 
      className={`thumbnail-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`Go to page ${pageNumber}`}
    >
      <div className="thumbnail-preview">
        <canvas ref={canvasRef} className="thumbnail-canvas" />
      </div>
      <span className="thumbnail-label">Page {pageNumber}</span>
    </div>
  );
}
