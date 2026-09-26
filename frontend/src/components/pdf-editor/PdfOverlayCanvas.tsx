import React, { useRef, useState, useEffect } from 'react';
import type { 
  EditorObject, 
  TextObject, 
  ImageObject, 
  SignatureObject, 
  ShapeObject, 
  WatermarkObject, 
  RedactionObject 
} from './types';
import { screenToEditor, editorToPDF, pdfToEditor, calculateRotationAngle } from './coordinates';

interface PdfOverlayCanvasProps {
  currentPage: number;
  scale: number; // zoom / 100
  displayWidth: number;
  displayHeight: number;
  objects: EditorObject[];
  selectedObjectId: string | null;
  activeTool: string;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (updated: EditorObject) => void;
  onAddObject: (newObj: EditorObject) => void;
  onDeleteSelected: () => void;
}

export default function PdfOverlayCanvas({
  currentPage,
  scale,
  displayWidth,
  displayHeight,
  objects,
  selectedObjectId,
  activeTool,
  onSelectObject,
  onUpdateObject,
  onAddObject,
  onDeleteSelected,
}: PdfOverlayCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction tracking state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'se', 'sw', 'ne', 'nw'
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialObjectState, setInitialObjectState] = useState<EditorObject | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const pageObjects = objects.filter(o => o.page === currentPage);
  const selectedObject = pageObjects.find(o => o.id === selectedObjectId);

  // Handle keyboard shortcuts (Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return; // Don't delete while typing inside text input
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) {
          e.preventDefault();
          onDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        onSelectObject(null);
        setEditingTextId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, editingTextId, onDeleteSelected, onSelectObject]);

  // Handle canvas background click to add new elements or deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const editorPoint = screenToEditor(e.clientX, e.clientY, rect);
    const pdfPoint = editorToPDF(editorPoint.x, editorPoint.y, scale);

    if (activeTool === 'text') {
      const newText: TextObject = {
        id: `text-${Date.now()}`,
        type: 'text',
        page: currentPage,
        x: pdfPoint.x,
        y: pdfPoint.y,
        width: 160,
        height: 40,
        rotation: 0,
        opacity: 1,
        text: 'Type your text here',
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        color: '#000000',
        textAlign: 'left',
      };
      onAddObject(newText);
      onSelectObject(newText.id);
      setEditingTextId(newText.id);
    } else if (activeTool === 'shape') {
      const newShape: ShapeObject = {
        id: `shape-${Date.now()}`,
        type: 'rectangle',
        page: currentPage,
        x: pdfPoint.x,
        y: pdfPoint.y,
        width: 140,
        height: 90,
        rotation: 0,
        opacity: 1,
        strokeColor: '#00f0ff',
        strokeWidth: 2,
        fillColor: 'transparent',
      };
      onAddObject(newShape);
      onSelectObject(newShape.id);
    } else if (activeTool === 'watermark') {
      const newWatermark: WatermarkObject = {
        id: `watermark-${Date.now()}`,
        type: 'watermark',
        page: currentPage,
        x: pdfPoint.x,
        y: pdfPoint.y,
        width: 280,
        height: 60,
        rotation: 45,
        opacity: 0.35,
        text: 'CONFIDENTIAL',
        fontSize: 32,
        color: '#ef4444',
      };
      onAddObject(newWatermark);
      onSelectObject(newWatermark.id);
    } else if (activeTool === 'redact') {
      const newRedaction: RedactionObject = {
        id: `redact-${Date.now()}`,
        type: 'redaction',
        page: currentPage,
        x: pdfPoint.x,
        y: pdfPoint.y,
        width: 140,
        height: 35,
        rotation: 0,
        opacity: 1,
        fillColor: '#000000',
      };
      onAddObject(newRedaction);
      onSelectObject(newRedaction.id);
    } else if (activeTool === 'highlight') {
      const newHighlight: ShapeObject = {
        id: `highlight-${Date.now()}`,
        type: 'rectangle',
        page: currentPage,
        x: pdfPoint.x,
        y: pdfPoint.y,
        width: 180,
        height: 24,
        rotation: 0,
        opacity: 0.45,
        strokeColor: 'transparent',
        strokeWidth: 0,
        fillColor: '#facc15',
      };
      onAddObject(newHighlight);
      onSelectObject(newHighlight.id);
    } else {
      onSelectObject(null);
      setEditingTextId(null);
    }
  };

  // Start Move
  const handleObjectMouseDown = (e: React.MouseEvent, obj: EditorObject) => {
    e.stopPropagation();
    onSelectObject(obj.id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialObjectState({ ...obj });
  };

  // Start Resize
  const handleResizeHandleDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedObject) return;
    setIsResizing(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialObjectState({ ...selectedObject });
  };

  // Start Rotate
  const handleRotateHandleDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedObject) return;
    setIsRotating(true);
    setInitialObjectState({ ...selectedObject });
  };

  // Window mouse move listener for smooth drag, resize, rotate
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!initialObjectState || !containerRef.current) return;

      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        onUpdateObject({
          ...initialObjectState,
          x: Math.max(0, initialObjectState.x + deltaX),
          y: Math.max(0, initialObjectState.y + deltaY),
        });
      } else if (isResizing) {
        let newWidth = initialObjectState.width;
        let newHeight = initialObjectState.height;
        let newX = initialObjectState.x;
        let newY = initialObjectState.y;

        if (isResizing.includes('e')) newWidth = Math.max(30, initialObjectState.width + deltaX);
        if (isResizing.includes('s')) newHeight = Math.max(20, initialObjectState.height + deltaY);
        if (isResizing.includes('w')) {
          const proposedWidth = Math.max(30, initialObjectState.width - deltaX);
          newX = initialObjectState.x + (initialObjectState.width - proposedWidth);
          newWidth = proposedWidth;
        }
        if (isResizing.includes('n')) {
          const proposedHeight = Math.max(20, initialObjectState.height - deltaY);
          newY = initialObjectState.y + (initialObjectState.height - proposedHeight);
          newHeight = proposedHeight;
        }

        onUpdateObject({
          ...initialObjectState,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      } else if (isRotating && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Object center in screen coordinates
        const centerEditor = pdfToEditor(
          initialObjectState.x + initialObjectState.width / 2,
          initialObjectState.y + initialObjectState.height / 2,
          scale
        );
        const centerScreenX = rect.left + centerEditor.x;
        const centerScreenY = rect.top + centerEditor.y;

        const deg = calculateRotationAngle(centerScreenX, centerScreenY, e.clientX, e.clientY);
        onUpdateObject({
          ...initialObjectState,
          rotation: deg,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      setIsRotating(false);
      setInitialObjectState(null);
    };

    if (isDragging || isResizing || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, dragStart, initialObjectState, scale, onUpdateObject]);

  return (
    <div
      ref={containerRef}
      className={`pdf-overlay-canvas ${activeTool === 'text' ? 'tool-text-active' : ''}`}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
      onClick={handleCanvasClick}
    >
      {pageObjects.map((obj) => {
        const isSelected = obj.id === selectedObjectId;
        const screenPos = pdfToEditor(obj.x, obj.y, scale);
        const screenWidth = obj.width * scale;
        const screenHeight = obj.height * scale;

        return (
          <div
            key={obj.id}
            className={`overlay-object ${isSelected ? 'selected' : ''}`}
            style={{
              transform: `translate(${screenPos.x}px, ${screenPos.y}px) rotate(${obj.rotation}deg)`,
              width: `${screenWidth}px`,
              height: `${screenHeight}px`,
              opacity: obj.opacity,
            }}
            onMouseDown={(e) => handleObjectMouseDown(e, obj)}
            onDoubleClick={() => {
              if (obj.type === 'text') setEditingTextId(obj.id);
            }}
          >
            {/* 1. TEXT OBJECT */}
            {obj.type === 'text' && (
              <div 
                className="text-object-content"
                style={{
                  fontSize: `${(obj as TextObject).fontSize * scale}px`,
                  fontFamily: (obj as TextObject).fontFamily,
                  color: (obj as TextObject).color,
                  fontWeight: (obj as TextObject).isBold ? 'bold' : 'normal',
                  fontStyle: (obj as TextObject).isItalic ? 'italic' : 'normal',
                  textDecoration: (obj as TextObject).isUnderline ? 'underline' : 'none',
                  textAlign: (obj as TextObject).textAlign || 'left',
                }}
              >
                {editingTextId === obj.id ? (
                  <textarea
                    autoFocus
                    value={(obj as TextObject).text}
                    onChange={(e) => {
                      onUpdateObject({
                        ...obj,
                        text: e.target.value,
                      });
                    }}
                    onBlur={() => setEditingTextId(null)}
                    className="inline-text-editor"
                  />
                ) : (
                  <span>{(obj as TextObject).text}</span>
                )}
              </div>
            )}

            {/* 2. IMAGE OBJECT */}
            {obj.type === 'image' && (
              <img
                src={(obj as ImageObject).src}
                alt="Document Attachment"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}

            {/* 3. SIGNATURE OBJECT */}
            {obj.type === 'signature' && (
              <img
                src={(obj as SignatureObject).signatureDataUrl}
                alt="Signature"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}

            {/* 4. RECTANGLE SHAPE */}
            {obj.type === 'rectangle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  border: `${Math.max(1, ((obj as ShapeObject).strokeWidth || 2) * scale)}px solid ${(obj as ShapeObject).strokeColor || '#00f0ff'}`,
                  backgroundColor: (obj as ShapeObject).fillColor || 'transparent',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {/* 5. CIRCLE SHAPE */}
            {obj.type === 'circle' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  border: `${Math.max(1, ((obj as ShapeObject).strokeWidth || 2) * scale)}px solid ${(obj as ShapeObject).strokeColor || '#00f0ff'}`,
                  backgroundColor: (obj as ShapeObject).fillColor || 'transparent',
                  borderRadius: '50%',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {/* 6. WATERMARK */}
            {obj.type === 'watermark' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${(obj as WatermarkObject).fontSize * scale}px`,
                  fontWeight: 800,
                  color: (obj as WatermarkObject).color || '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                {(obj as WatermarkObject).text}
              </div>
            )}

            {/* 7. REDACTION */}
            {obj.type === 'redaction' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: (obj as RedactionObject).fillColor || '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: `${Math.max(9, 10 * scale)}px`,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  userSelect: 'none',
                  boxShadow: 'inset 0 0 4px rgba(255,255,255,0.2)',
                }}
              >
                REDACTED
              </div>
            )}

            {/* Selection Box & Transform Controls */}
            {isSelected && (
              <div className="selection-frame">
                {/* Visual Rotation Stem & Handle */}
                <div 
                  className="rotation-handle"
                  onMouseDown={handleRotateHandleDown}
                  title="Drag to Rotate (↻)"
                >
                  <div className="rotation-stem" />
                  <div className="rotation-knob">↻</div>
                  {isRotating && (
                    <span className="rotation-angle-badge">{obj.rotation}°</span>
                  )}
                </div>

                {/* 4 Corner Resize Handles */}
                <div className="resize-handle handle-nw" onMouseDown={(e) => handleResizeHandleDown(e, 'nw')} />
                <div className="resize-handle handle-ne" onMouseDown={(e) => handleResizeHandleDown(e, 'ne')} />
                <div className="resize-handle handle-se" onMouseDown={(e) => handleResizeHandleDown(e, 'se')} />
                <div className="resize-handle handle-sw" onMouseDown={(e) => handleResizeHandleDown(e, 'sw')} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
