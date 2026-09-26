import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import PdfToolbar from '../../components/pdf-editor/PdfToolbar';
import PdfWorkspace from '../../components/pdf-editor/PdfWorkspace';
import type { ToolType } from '../../components/pdf-editor/PdfWorkspace';
import PdfViewer from '../../components/pdf-editor/PdfViewer';
import PdfOverlayCanvas from '../../components/pdf-editor/PdfOverlayCanvas';
import { loadPdfDocument, cancelAllCanvasRenders, type PdfDoc } from '../../components/pdf-editor/pdfRenderer';
import type { EditorObject } from '../../components/pdf-editor/types';

export default function PdfEditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfDoc | null>(null);
  const [docId, setDocId] = useState<string>(() => Date.now().toString());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editor Objects & Selection State
  const [objects, setObjects] = useState<EditorObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({ width: 595, height: 842 });

  // Undo / Redo History Stack
  const [history, setHistory] = useState<EditorObject[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pushToHistory = (newObjects: EditorObject[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newObjects);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setObjects(history[prevIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setObjects(history[nextIndex]);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // File loading and validation
  const processUploadedFile = async (uploadedFile: File) => {
    const isPdf = uploadedFile.type === 'application/pdf' || uploadedFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('Invalid file type. Please upload a valid .pdf document.');
      return;
    }

    const MAX_SIZE_MB = 50;
    if (uploadedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File is too large (${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    // 1. Automatically cancel all existing canvas render operations across the app
    cancelAllCanvasRenders();

    // 2. Destroy previous PDF document if open to release memory & worker threads
    if (pdfDoc) {
      try {
        pdfDoc.destroy();
      } catch {
        // ignore
      }
    }

    // 3. Clear previous doc state and generate a fresh document session ID
    setPdfDoc(null);
    setTotalPages(0);
    setIsLoading(true);
    setErrorMessage(null);
    setFile(uploadedFile);
    const newDocId = `${uploadedFile.name}_${uploadedFile.lastModified}_${Date.now()}`;
    setDocId(newDocId);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const doc = await loadPdfDocument(buffer);
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setObjects([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedObjectId(null);
    } catch (err: unknown) {
      console.error('Failed to load PDF document:', err);
      const message = err instanceof Error ? err.message : 'The document could not be read or is encrypted.';
      setErrorMessage(`Failed to open PDF: ${message}`);
      setPdfDoc(null);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
    // Reset input value so selecting the same file again triggers onChange reliably
    e.target.value = '';
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleFitWidth = () => setZoom(100);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePageSelect = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedObjectId(null);
  }, []);

  // Object Operations
  const handleAddObject = (newObj: EditorObject) => {
    const updated = [...objects, newObj];
    setObjects(updated);
    pushToHistory(updated);
  };

  const handleUpdateObject = (updatedObj: EditorObject) => {
    const updated = objects.map(o => (o.id === updatedObj.id ? updatedObj : o));
    setObjects(updated);
    pushToHistory(updated);
  };

  const handleDeleteSelected = () => {
    if (!selectedObjectId) return;
    const updated = objects.filter(o => o.id !== selectedObjectId);
    setObjects(updated);
    setSelectedObjectId(null);
    pushToHistory(updated);
  };

  const handleDuplicateSelected = () => {
    if (!selectedObjectId) return;
    const target = objects.find(o => o.id === selectedObjectId);
    if (!target) return;

    const duplicated: EditorObject = {
      ...target,
      id: `${target.type}-${Date.now()}`,
      x: target.x + 20,
      y: target.y + 20,
    };
    const updated = [...objects, duplicated];
    setObjects(updated);
    setSelectedObjectId(duplicated.id);
    pushToHistory(updated);
  };

  const selectedObject = objects.find(o => o.id === selectedObjectId) || null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="pdf-editor-module-page animate-fade-in-up">
      <Header tagline="PDF EDITOR & ANNOTATION SUITE" />

      <div className="container editor-container">
        {/* Navigation Breadcrumb */}
        <div className="hub-breadcrumbs">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/tools" className="breadcrumb-link">Tools</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">PDF Editor</span>
        </div>

        {/* Hidden File Input */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="application/pdf" 
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {/* Top Action Toolbar */}
        <PdfToolbar
          fileName={file?.name}
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          canUndo={canUndo}
          canRedo={canRedo}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitWidth={handleFitWidth}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={() => {}}
          onUploadNew={() => fileInputRef.current?.click()}
        />

        {/* 4-Panel Editor Workspace */}
        <PdfWorkspace
          docId={docId}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          currentPage={currentPage}
          totalPages={totalPages}
          pdfDoc={pdfDoc}
          isLoading={isLoading}
          errorMessage={errorMessage}
          selectedObject={selectedObject}
          onUploadClick={() => fileInputRef.current?.click()}
          onFileDrop={processUploadedFile}
          onPageChange={handlePageSelect}
          onUpdateObject={handleUpdateObject}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
        >
          {pdfDoc && (
            <div 
              className="pdf-page-composite-wrapper"
              style={{ width: `${pageDims.width}px`, height: `${pageDims.height}px` }}
            >
              <PdfViewer
                key={`${docId}-page-${currentPage}`}
                pdfDoc={pdfDoc}
                currentPage={currentPage}
                zoom={zoom}
                onPageDimensionsChange={setPageDims}
              />
              <PdfOverlayCanvas
                currentPage={currentPage}
                scale={zoom / 100}
                displayWidth={pageDims.width}
                displayHeight={pageDims.height}
                objects={objects}
                selectedObjectId={selectedObjectId}
                activeTool={activeTool}
                onSelectObject={setSelectedObjectId}
                onUpdateObject={handleUpdateObject}
                onAddObject={handleAddObject}
                onDeleteSelected={handleDeleteSelected}
              />
            </div>
          )}
        </PdfWorkspace>
      </div>
    </div>
  );
}
