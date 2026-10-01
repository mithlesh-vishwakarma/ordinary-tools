/**
 * Centralized coordinate conversion utilities for the PDF Editor.
 * Browser uses CSS pixels (scaled by zoom & viewport offset).
 * PDF documents use 72-dpi unscaled PDF points.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Converts mouse/touch event screen coordinates to coordinates relative to the editor overlay container.
 */
export function screenToEditor(
  clientX: number,
  clientY: number,
  containerRect: DOMRect
): Point {
  return {
    x: clientX - containerRect.left,
    y: clientY - containerRect.top,
  };
}

/**
 * Converts editor overlay pixel coordinates to unscaled PDF points.
 */
export function editorToPDF(
  editorX: number,
  editorY: number,
  scale: number
): Point {
  const safeScale = scale > 0 ? scale : 1.0;
  return {
    x: editorX / safeScale,
    y: editorY / safeScale,
  };
}

/**
 * Converts unscaled PDF points to editor overlay pixel coordinates.
 */
export function pdfToEditor(
  pdfX: number,
  pdfY: number,
  scale: number
): Point {
  return {
    x: pdfX * scale,
    y: pdfY * scale,
  };
}

/**
 * Calculate angle between center point and mouse position in degrees (0 - 360).
 */
export function calculateRotationAngle(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number
): number {
  const radians = Math.atan2(pointerY - centerY, pointerX - centerX);
  let degrees = Math.round(radians * (180 / Math.PI));
  // Adjust so that top handle pointing up is 0 degrees
  degrees = (degrees + 90 + 360) % 360;
  return degrees;
}

/**
 * Samples the background paper color from the rendered PDF canvas at a screen client position.
 * Uses a small window to ignore dark foreground text strokes and capture the true paper background.
 */
export function sampleCanvasBackgroundAtScreen(clientX: number, clientY: number): string {
  try {
    const mainCanvas = document.querySelector<HTMLCanvasElement>('.pdf-main-canvas');
    if (!mainCanvas) return '#ffffff';
    const ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#ffffff';

    const rect = mainCanvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return '#ffffff';
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;

    const canvasX = Math.floor((clientX - rect.left) * scaleX);
    const canvasY = Math.floor((clientY - rect.top) * scaleY);

    if (canvasX >= 0 && canvasX < mainCanvas.width && canvasY >= 0 && canvasY < mainCanvas.height) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const sampleRadius = 3;
      for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
        for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
          const sx = Math.min(Math.max(0, canvasX + dx), mainCanvas.width - 1);
          const sy = Math.min(Math.max(0, canvasY + dy), mainCanvas.height - 1);
          const pixel = ctx.getImageData(sx, sy, 1, 1).data;
          if (pixel[3] > 0) {
            const brightness = (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000;
            // Prefer the lighter background paper pixels rather than dark text pixels
            if (brightness > 80) {
              rSum += pixel[0];
              gSum += pixel[1];
              bSum += pixel[2];
              count++;
            }
          }
        }
      }

      if (count > 0) {
        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);
        return '#' + [avgR, avgG, avgB].map(x => x.toString(16).padStart(2, '0')).join('');
      } else {
        const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
        if (pixel[3] > 0) {
          return '#' + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('');
        }
      }
    }
  } catch (err) {
    console.warn('Canvas color sample error:', err);
  }
  return '#ffffff';
}

/**
 * Samples the background paper color from the rendered PDF canvas given PDF point coordinates.
 */
export function sampleCanvasBackgroundAtPdfPoint(pdfX: number, pdfY: number, scale: number): string {
  try {
    const mainCanvas = document.querySelector<HTMLCanvasElement>('.pdf-main-canvas');
    if (!mainCanvas) return '#ffffff';
    const rect = mainCanvas.getBoundingClientRect();
    const screenX = rect.left + pdfX * scale;
    const screenY = rect.top + pdfY * scale;
    return sampleCanvasBackgroundAtScreen(screenX, screenY);
  } catch {
    return '#ffffff';
  }
}

