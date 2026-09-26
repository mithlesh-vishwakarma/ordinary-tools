import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export type PdfDoc = pdfjsLib.PDFDocumentProxy;

interface CanvasRenderSession {
  id: number;
  cancelled: boolean;
  renderTask?: pdfjsLib.RenderTask;
  promise?: Promise<any>;
}

// Active session tracking per canvas to ensure atomic, serialized page rendering
const activeSessions = new WeakMap<HTMLCanvasElement, CanvasRenderSession>();
const registeredCanvases = new Set<HTMLCanvasElement>();
let sessionCounter = 0;

/**
 * Cancel any ongoing render task on a canvas and clean up session
 */
export function cancelCanvasRender(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const session = activeSessions.get(canvas);
  if (session) {
    session.cancelled = true;
    if (session.renderTask) {
      try {
        session.renderTask.cancel();
      } catch {
        // Ignore cancellation error
      }
    }
    activeSessions.delete(canvas);
  }
}

/**
 * Cancel all active render tasks across all canvases (e.g., when document changes)
 */
export function cancelAllCanvasRenders() {
  for (const canvas of registeredCanvases) {
    cancelCanvasRender(canvas);
  }
  registeredCanvases.clear();
}

/**
 * Check if an error was due to intentional rendering cancellation
 */
export function isRenderingCancelledError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const errorObj = err as { name?: string; message?: string };
  return (
    errorObj.name === 'RenderingCancelledException' ||
    Boolean(errorObj.message && errorObj.message.toLowerCase().includes('cancelled'))
  );
}

/**
 * Load a PDF document from an ArrayBuffer
 */
export async function loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<PdfDoc> {
  const version = pdfjsLib.version || '6.3.289';
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/cmaps/`,
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Render a single page onto an HTML5 canvas at a specific scale
 */
export async function renderPageToCanvas(
  pdfDoc: PdfDoc,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<{ width: number; height: number; originalWidth: number; originalHeight: number }> {
  registeredCanvases.add(canvas);

  // 1. Cancel and await any active render session on this canvas
  const prevSession = activeSessions.get(canvas);
  if (prevSession) {
    prevSession.cancelled = true;
    if (prevSession.renderTask) {
      try {
        prevSession.renderTask.cancel();
      } catch {
        // Ignore cancellation error
      }
    }
    if (prevSession.promise) {
      try {
        await prevSession.promise;
      } catch {
        // Expected cancellation exception
      }
    }
  }

  // 2. Register new session
  const currentSession: CanvasRenderSession = {
    id: ++sessionCounter,
    cancelled: false,
  };
  activeSessions.set(canvas, currentSession);

  // 3. Retrieve page from PDF
  const page = await pdfDoc.getPage(pageNumber);

  // If session was cancelled while loading page (e.g. user selected another doc/page), abort cleanly
  if (currentSession.cancelled) {
    const cancelErr = new Error('Rendering cancelled');
    cancelErr.name = 'RenderingCancelledException';
    throw cancelErr;
  }

  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const viewport = page.getViewport({ scale });

  // Canvas context
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  // Adjust for high-DPI displays (retina) for ultra crisp rendering
  const outputScale = window.devicePixelRatio || 1;
  const scaledWidth = Math.floor(viewport.width * outputScale);
  const scaledHeight = Math.floor(viewport.height * outputScale);

  if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
  }
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

  const renderContext = {
    canvasContext: context,
    canvas: canvas,
    viewport: viewport,
    transform: transform,
  };

  // Re-check cancellation right before beginning draw operation
  if (currentSession.cancelled) {
    const cancelErr = new Error('Rendering cancelled');
    cancelErr.name = 'RenderingCancelledException';
    throw cancelErr;
  }

  // @ts-expect-error pdfjs renderContext interface matching
  const renderTask = page.render(renderContext);
  currentSession.renderTask = renderTask;
  currentSession.promise = renderTask.promise;

  try {
    await renderTask.promise;
  } catch (err) {
    if (isRenderingCancelledError(err)) {
      throw err;
    }
    throw err;
  } finally {
    if (activeSessions.get(canvas)?.id === currentSession.id) {
      activeSessions.delete(canvas);
    }
  }

  return {
    width: viewport.width,
    height: viewport.height,
    originalWidth: unscaledViewport.width,
    originalHeight: unscaledViewport.height,
  };
}

/**
 * Render a page thumbnail onto a small canvas
 */
export async function renderPageThumbnail(
  pdfDoc: PdfDoc,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetWidth: number = 70
): Promise<void> {
  registeredCanvases.add(canvas);

  const prevSession = activeSessions.get(canvas);
  if (prevSession) {
    prevSession.cancelled = true;
    if (prevSession.renderTask) {
      try {
        prevSession.renderTask.cancel();
      } catch {
        // Ignore cancellation error
      }
    }
    if (prevSession.promise) {
      try {
        await prevSession.promise;
      } catch {
        // Expected cancellation exception
      }
    }
  }

  const currentSession: CanvasRenderSession = {
    id: ++sessionCounter,
    cancelled: false,
  };
  activeSessions.set(canvas, currentSession);

  const page = await pdfDoc.getPage(pageNumber);

  if (currentSession.cancelled) {
    return;
  }

  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const outputScale = window.devicePixelRatio || 1;
  const scaledWidth = Math.floor(viewport.width * outputScale);
  const scaledHeight = Math.floor(viewport.height * outputScale);

  if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
  }
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

  const renderContext = {
    canvasContext: context,
    canvas: canvas,
    viewport: viewport,
    transform: transform,
  };

  if (currentSession.cancelled) {
    return;
  }

  // @ts-expect-error pdfjs renderContext interface matching
  const renderTask = page.render(renderContext);
  currentSession.renderTask = renderTask;
  currentSession.promise = renderTask.promise;

  try {
    await renderTask.promise;
  } catch (err) {
    if (isRenderingCancelledError(err)) {
      return;
    }
    throw err;
  } finally {
    if (activeSessions.get(canvas)?.id === currentSession.id) {
      activeSessions.delete(canvas);
    }
  }
}
