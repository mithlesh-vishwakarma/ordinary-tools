import React, { useRef, useState, useEffect } from 'react';
import type { 
  EditorObject, 
  TextObject, 
  ImageObject, 
  SignatureObject, 
  ShapeObject, 
  DrawingObject,
  WatermarkObject, 
  RedactionObject,
  WhiteoutObject,
  DrawingPoint
} from './types';
import { 
  screenToEditor, 
  editorToPDF, 
  pdfToEditor, 
  calculateRotationAngle,
  sampleCanvasBackgroundAtScreen
} from './coordinates';

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
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n'
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialObjectState, setInitialObjectState] = useState<EditorObject | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Freehand Drawing Live State
  const [isDrawingLive, setIsDrawingLive] = useState<boolean>(false);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<DrawingPoint[]>([]);

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

  // Handle canvas background mouse down (for drawing or clicking)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const editorPoint = screenToEditor(e.clientX, e.clientY, rect);
    const pdfPoint = editorToPDF(editorPoint.x, editorPoint.y, scale);

    if (activeTool === 'draw') {
      setIsDrawingLive(true);
      setCurrentDrawingPoints([{ x: pdfPoint.x, y: pdfPoint.y }]);
      onSelectObject(null);
    }
  };

  // Handle canvas background click to add elements or deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    if (!containerRef.current) return;
    if (isDrawingLive) return; // Handled by mouse up

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
        width: 180,
        height: 44,
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
        x: Math.max(20, pdfPoint.x - 140),
        y: Math.max(20, pdfPoint.y - 30),
        width: 320,
        height: 70,
        rotation: 45,
        opacity: 0.35,
        text: 'CONFIDENTIAL',
        fontSize: 32,
        color: '#ef4444',
      };
      onAddObject(newWatermark);
      onSelectObject(newWatermark.id);
    } else if (activeTool === 'redact' || activeTool === 'whiteout') {
      const sampledBg = sampleCanvasBackgroundAtScreen(e.clientX, e.clientY);
      const isRedactTool = activeTool === 'redact';
      const newObj: RedactionObject | WhiteoutObject = isRedactTool ? {
        id: `redact-${Date.now()}`,
        type: 'redaction',
        page: currentPage,
        x: pdfPoint.x,
        y: pdfPoint.y,
        width: 140,
        height: 28,
        rotation: 0,
        opacity: 1,
        fillColor: sampledBg || '#ffffff',
      } : {
        id: `whiteout-${Date.now()}`,
        type: 'whiteout',
        page: currentPage,
        x: pdfPoint.x,
        y: pdfPoint.y,
        width: 140,
        height: 28,
        rotation: 0,
        opacity: 1,
        fillColor: sampledBg || '#ffffff',
      };
      onAddObject(newObj);
      onSelectObject(newObj.id);
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
    if (activeTool === 'draw') return; // In drawing mode, allow drawing over existing shapes
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

  // Global mouse move & mouse up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Freehand drawing mode live tracking
      if (isDrawingLive && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const editorPoint = screenToEditor(e.clientX, e.clientY, rect);
        const pdfPoint = editorToPDF(editorPoint.x, editorPoint.y, scale);
        setCurrentDrawingPoints(prev => [...prev, { x: pdfPoint.x, y: pdfPoint.y }]);
        return;
      }

      // 2. Drag, Resize, Rotate of existing objects
      if (!initialObjectState || !containerRef.current) return;

      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        const newX = Math.max(0, initialObjectState.x + deltaX);
        const newY = Math.max(0, initialObjectState.y + deltaY);

        if (initialObjectState.type === 'drawing' || initialObjectState.type === 'highlight') {
          const drawObj = initialObjectState as DrawingObject;
          const shiftX = newX - initialObjectState.x;
          const shiftY = newY - initialObjectState.y;
          onUpdateObject({
            ...drawObj,
            x: newX,
            y: newY,
            points: drawObj.points.map(p => ({
              x: p.x + shiftX,
              y: p.y + shiftY,
            })),
          });
        } else {
          onUpdateObject({
            ...initialObjectState,
            x: newX,
            y: newY,
          });
        }
      } else if (isResizing) {
        let newWidth = initialObjectState.width;
        let newHeight = initialObjectState.height;
        let newX = initialObjectState.x;
        let newY = initialObjectState.y;

        if (isResizing.includes('e')) newWidth = Math.max(1, initialObjectState.width + deltaX);
        if (isResizing.includes('s')) newHeight = Math.max(1, initialObjectState.height + deltaY);
        if (isResizing.includes('w')) {
          const proposedWidth = Math.max(1, initialObjectState.width - deltaX);
          newX = initialObjectState.x + (initialObjectState.width - proposedWidth);
          newWidth = proposedWidth;
        }
        if (isResizing.includes('n')) {
          const proposedHeight = Math.max(1, initialObjectState.height - deltaY);
          newY = initialObjectState.y + (initialObjectState.height - proposedHeight);
          newHeight = proposedHeight;
        }

        if (initialObjectState.type === 'drawing' || initialObjectState.type === 'highlight') {
          const drawObj = initialObjectState as DrawingObject;
          const scaleX = newWidth / (initialObjectState.width || 1);
          const scaleY = newHeight / (initialObjectState.height || 1);
          onUpdateObject({
            ...drawObj,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            points: drawObj.points.map(p => ({
              x: newX + (p.x - initialObjectState.x) * scaleX,
              y: newY + (p.y - initialObjectState.y) * scaleY,
            })),
          });
        } else {
          onUpdateObject({
            ...initialObjectState,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          });
        }
      } else if (isRotating && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
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
      // Complete freehand drawing path
      if (isDrawingLive) {
        if (currentDrawingPoints.length >= 2) {
          const minX = Math.min(...currentDrawingPoints.map(p => p.x));
          const maxX = Math.max(...currentDrawingPoints.map(p => p.x));
          const minY = Math.min(...currentDrawingPoints.map(p => p.y));
          const maxY = Math.max(...currentDrawingPoints.map(p => p.y));
          const w = Math.max(16, maxX - minX);
          const h = Math.max(16, maxY - minY);

          const newDrawing: DrawingObject = {
            id: `draw-${Date.now()}`,
            type: 'drawing',
            page: currentPage,
            x: minX,
            y: minY,
            width: w,
            height: h,
            rotation: 0,
            opacity: 1,
            points: currentDrawingPoints,
            strokeColor: '#00f0ff',
            strokeWidth: 3,
          };
          onAddObject(newDrawing);
          onSelectObject(newDrawing.id);
        }
        setIsDrawingLive(false);
        setCurrentDrawingPoints([]);
      }

      setIsDragging(false);
      setIsResizing(null);
      setIsRotating(false);
      setInitialObjectState(null);
    };

    if (isDragging || isResizing || isRotating || isDrawingLive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging, 
    isResizing, 
    isRotating, 
    isDrawingLive, 
    currentDrawingPoints, 
    dragStart, 
    initialObjectState, 
    scale, 
    currentPage,
    onAddObject,
    onSelectObject,
    onUpdateObject
  ]);

  // Helper to compute 5-pointed star points inside bounding box
  const getStarPoints = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const rOuter = Math.min(w, h) / 2;
    const rInner = rOuter * 0.4;
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div
      ref={containerRef}
      className={`pdf-overlay-canvas ${
        activeTool === 'text' ? 'tool-text-active' : 
        activeTool === 'draw' ? 'tool-draw-active' : 
        activeTool === 'redact' || activeTool === 'whiteout' ? 'tool-redact-active' : ''
      }`}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
      onMouseDown={handleCanvasMouseDown}
      onClick={handleCanvasClick}
    >
      {/* Live Freehand Drawing Preview */}
      {isDrawingLive && currentDrawingPoints.length > 0 && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 90,
          }}
        >
          <polyline
            points={currentDrawingPoints.map(p => `${p.x * scale},${p.y * scale}`).join(' ')}
            fill="none"
            stroke="#00f0ff"
            strokeWidth={3 * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Rendered Page Objects */}
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
                    style={{ fontSize: (obj as TextObject).fontSize > 0 ? undefined : '13px' }}
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
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                }}
              />
            )}

            {/* 4. FREEHAND DRAWING / HIGHLIGHT OBJECT */}
            {(obj.type === 'drawing' || obj.type === 'highlight') && (
              <svg
                width="100%"
                height="100%"
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <polyline
                  points={(obj as DrawingObject).points
                    .map(p => `${(p.x - obj.x) * scale},${(p.y - obj.y) * scale}`)
                    .join(' ')}
                  fill="none"
                  stroke={(obj as DrawingObject).strokeColor || '#00f0ff'}
                  strokeWidth={Math.max(1, ((obj as DrawingObject).strokeWidth || 3) * scale)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {/* 5. RECTANGLE SHAPES */}
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

            {obj.type === 'rounded-rect' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  border: `${Math.max(1, ((obj as ShapeObject).strokeWidth || 2) * scale)}px solid ${(obj as ShapeObject).strokeColor || '#00f0ff'}`,
                  backgroundColor: (obj as ShapeObject).fillColor || 'transparent',
                  borderRadius: `${12 * scale}px`,
                  boxSizing: 'border-box',
                }}
              />
            )}

            {/* 6. CIRCLE SHAPE */}
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

            {/* 7. LINE SHAPE */}
            {obj.type === 'line' && (
              <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <line
                  x1="0"
                  y1={screenHeight / 2}
                  x2={screenWidth}
                  y2={screenHeight / 2}
                  stroke={(obj as ShapeObject).strokeColor || '#00f0ff'}
                  strokeWidth={Math.max(1, ((obj as ShapeObject).strokeWidth || 2) * scale)}
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* 8. ARROW SHAPE */}
            {obj.type === 'arrow' && (
              <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <defs>
                  <marker
                    id={`arrowhead-${obj.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0,0 8,4 0,8" fill={(obj as ShapeObject).strokeColor || '#00f0ff'} />
                  </marker>
                </defs>
                <line
                  x1="0"
                  y1={screenHeight / 2}
                  x2={Math.max(0, screenWidth - 8 * scale)}
                  y2={screenHeight / 2}
                  stroke={(obj as ShapeObject).strokeColor || '#00f0ff'}
                  strokeWidth={Math.max(1, ((obj as ShapeObject).strokeWidth || 2) * scale)}
                  markerEnd={`url(#arrowhead-${obj.id})`}
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* 9. TRIANGLE SHAPE */}
            {obj.type === 'triangle' && (
              <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <polygon
                  points={`${screenWidth / 2},0 ${screenWidth},${screenHeight} 0,${screenHeight}`}
                  fill={(obj as ShapeObject).fillColor || 'transparent'}
                  stroke={(obj as ShapeObject).strokeColor || '#00f0ff'}
                  strokeWidth={Math.max(1, ((obj as ShapeObject).strokeWidth || 2) * scale)}
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {/* 10. STAR SHAPE */}
            {obj.type === 'star' && (
              <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                <polygon
                  points={getStarPoints(screenWidth, screenHeight)}
                  fill={(obj as ShapeObject).fillColor || 'transparent'}
                  stroke={(obj as ShapeObject).strokeColor || '#00f0ff'}
                  strokeWidth={Math.max(1, ((obj as ShapeObject).strokeWidth || 2) * scale)}
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {/* 11. WATERMARK */}
            {obj.type === 'watermark' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${(obj as WatermarkObject).fontSize * scale}px`,
                  fontFamily: (obj as WatermarkObject).fontFamily || 'Inter, sans-serif',
                  fontWeight: 900,
                  color: (obj as WatermarkObject).color || '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  border: isSelected ? '1px dashed rgba(239, 68, 68, 0.4)' : 'none',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              >
                {(obj as WatermarkObject).text}
              </div>
            )}

            {/* 12. REDACTION */}
            {obj.type === 'redaction' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: (obj as RedactionObject).fillColor || '#ffffff',
                  boxSizing: 'border-box',
                  border: isSelected ? '1.5px dashed #00f0ff' : 'none',
                  boxShadow: isSelected ? '0 0 0 1px rgba(0, 240, 255, 0.4)' : 'none',
                }}
              />
            )}

            {/* 13. WHITEOUT / ERASER MASK */}
            {obj.type === 'whiteout' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: (obj as WhiteoutObject).fillColor || '#ffffff',
                  boxSizing: 'border-box',
                  border: isSelected ? '1.5px dashed #00f0ff' : 'none',
                  boxShadow: isSelected ? '0 0 0 1px rgba(0, 240, 255, 0.4)' : 'none',
                }}
              />
            )}

            {/* Selection Frame & Handles */}
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

                {/* 4 Side Resize Handles (Great for Watermark width length expansion!) */}
                <div className="resize-handle handle-e" onMouseDown={(e) => handleResizeHandleDown(e, 'e')} />
                <div className="resize-handle handle-w" onMouseDown={(e) => handleResizeHandleDown(e, 'w')} />
                <div className="resize-handle handle-s" onMouseDown={(e) => handleResizeHandleDown(e, 's')} />
                <div className="resize-handle handle-n" onMouseDown={(e) => handleResizeHandleDown(e, 'n')} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
