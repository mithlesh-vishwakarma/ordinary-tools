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
