import type { 
  EditorObject, 
  TextObject, 
  ShapeObject, 
  DrawingObject, 
  WatermarkObject, 
  RedactionObject,
  SignatureObject,
  WhiteoutObject
} from './types';
import { RotateIcon, TrashIcon, CopyIcon } from '../Icons';
import { sampleCanvasBackgroundAtPdfPoint } from './coordinates';
import { STANDARD_FONTS, type DocumentFontItem } from './fontExtractor';

interface PdfPropertiesPanelProps {
  selectedObject: EditorObject | null;
  documentFonts?: DocumentFontItem[];
  onUpdateObject: (updated: EditorObject) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
}

export default function PdfPropertiesPanel({
  selectedObject,
  documentFonts = [],
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
}: PdfPropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <aside className="workspace-properties-panel glass-card">
        <div className="panel-section-title">Properties Control</div>
        <div className="properties-empty">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚙️</div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Object Selected
          </p>
          <p style={{ fontSize: '0.8rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
            Select or add any text, shape, drawing, watermark, or whiteout on the document to adjust its styling and properties here.
          </p>
          {documentFonts.length > 0 && (
            <div style={{ marginTop: '16px', padding: '8px 10px', background: 'rgba(0, 240, 255, 0.06)', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.2)', textAlign: 'left' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px' }}>
                📄 {documentFonts.length} Fonts Detected in PDF
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {documentFonts.slice(0, 4).map(f => f.displayName).join(', ')}{documentFonts.length > 4 ? '...' : ''}
              </span>
            </div>
          )}
        </div>
      </aside>
    );
  }

  const isText = selectedObject.type === 'text';
  const isShape = ['rectangle', 'rounded-rect', 'circle', 'line', 'arrow', 'triangle', 'star'].includes(selectedObject.type);
  const isDrawing = selectedObject.type === 'drawing' || selectedObject.type === 'highlight';
  const isWatermark = selectedObject.type === 'watermark';
  const isRedaction = selectedObject.type === 'redaction';
  const isWhiteout = selectedObject.type === 'whiteout';
  const isSignature = selectedObject.type === 'signature';

  const textObj = isText ? (selectedObject as TextObject) : null;
  const shapeObj = isShape ? (selectedObject as ShapeObject) : null;
  const drawingObj = isDrawing ? (selectedObject as DrawingObject) : null;
  const watermarkObj = isWatermark ? (selectedObject as WatermarkObject) : null;
  const redactionObj = isRedaction ? (selectedObject as RedactionObject) : null;
  const whiteoutObj = isWhiteout ? (selectedObject as WhiteoutObject) : null;
  const signatureObj = isSignature ? (selectedObject as SignatureObject) : null;


  const colorPresets = [
    '#000000',
    '#ffffff',
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#00f0ff',
    '#3b82f6',
    '#a855f7',
  ];

  const shapeChoices: { id: ShapeObject['type']; label: string; icon: string }[] = [
    { id: 'rectangle', label: 'Rect', icon: '▢' },
    { id: 'rounded-rect', label: 'Round', icon: '▢' },
    { id: 'circle', label: 'Circle', icon: '◯' },
    { id: 'line', label: 'Line', icon: '―' },
    { id: 'arrow', label: 'Arrow', icon: '➔' },
    { id: 'triangle', label: 'Triangle', icon: '△' },
    { id: 'star', label: 'Star', icon: '★' },
  ];

  const handleRotationStep = (deg: number) => {
    onUpdateObject({
      ...selectedObject,
      rotation: deg % 360,
    });
  };

  const handleRotate90 = () => {
    onUpdateObject({
      ...selectedObject,
      rotation: (selectedObject.rotation + 90) % 360,
    });
  };

  return (
    <aside className="workspace-properties-panel glass-card">
      <div className="panel-section-title">Properties</div>

      <div className="properties-content">
        {/* Header Type Badge & Action Buttons */}
        <div className="property-header-actions">
          <span className="property-badge">{selectedObject.type.toUpperCase()}</span>
          <div className="header-action-btns">
            <button 
              className="btn-icon" 
              onClick={onDuplicateSelected} 
              title="Duplicate (Ctrl+D)"
            >
              <CopyIcon />
            </button>
            <button 
              className="btn-icon btn-icon--danger" 
              onClick={onDeleteSelected} 
              title="Delete (Del)"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* 1. TEXT PROPERTIES */}
        {textObj && (
          <>
            <div className="property-group">
              <label className="property-label">Text Content</label>
              <textarea
                value={textObj.text}
                onChange={(e) => onUpdateObject({ ...textObj, text: e.target.value })}
                className="property-textarea"
                rows={2}
              />
            </div>

            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Font Family</label>
                {documentFonts.length > 0 && (
                  <span className="property-value-badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    {documentFonts.length} in PDF
                  </span>
                )}
              </div>
              <select
                value={textObj.fontFamily}
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  const matchedDocFont = documentFonts.find(df => df.cssFamily === selectedVal);
                  onUpdateObject({ 
                    ...textObj, 
                    fontFamily: selectedVal,
                    ...(matchedDocFont?.isBold !== undefined ? { isBold: matchedDocFont.isBold } : {}),
                    ...(matchedDocFont?.isItalic !== undefined ? { isItalic: matchedDocFont.isItalic } : {}),
                  });
                }}
                className="property-select"
              >
                {documentFonts.length > 0 && (
                  <optgroup label="📄 From This Document">
                    {documentFonts.map((font) => (
                      <option key={`doc-${font.id}`} value={font.cssFamily}>
                        {font.displayName}
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="🌐 Standard Fonts">
                  {STANDARD_FONTS.map((font) => (
                    <option key={`std-${font.id}`} value={font.cssFamily}>
                      {font.displayName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="property-row">
              <div className="property-group flex-1">
                <div className="property-label-row">
                  <label className="property-label">Font Size</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={textObj.fontSize}
                    onChange={(e) => onUpdateObject({ ...textObj, fontSize: Math.max(0, Number(e.target.value) || 0) })}
                    className="property-number-input"
                    title="Font size in px (can be 0 or any custom size)"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={textObj.fontSize}
                  onChange={(e) => onUpdateObject({ ...textObj, fontSize: Number(e.target.value) })}
                  className="property-range"
                />
              </div>

              <div className="property-group">
                <label className="property-label">Align</label>
                <div className="style-button-group">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      className={`style-toggle-btn ${textObj.textAlign === align ? 'active' : ''}`}
                      onClick={() => onUpdateObject({ ...textObj, textAlign: align })}
                    >
                      {align === 'left' ? '⇤' : align === 'center' ? '≡' : '⇥'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="property-group">
              <label className="property-label">Styling</label>
              <div className="style-button-group">
                <button
                  className={`style-toggle-btn ${textObj.isBold ? 'active' : ''}`}
                  onClick={() => onUpdateObject({ ...textObj, isBold: !textObj.isBold })}
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  className={`style-toggle-btn ${textObj.isItalic ? 'active' : ''}`}
                  onClick={() => onUpdateObject({ ...textObj, isItalic: !textObj.isItalic })}
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  className={`style-toggle-btn ${textObj.isUnderline ? 'active' : ''}`}
                  onClick={() => onUpdateObject({ ...textObj, isUnderline: !textObj.isUnderline })}
                  title="Underline"
                >
                  <u>U</u>
                </button>
              </div>
            </div>

            <div className="property-group">
              <label className="property-label">Text Color</label>
              <div className="color-palette-picker">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    className={`color-preset-circle ${textObj.color.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => onUpdateObject({ ...textObj, color: c })}
                  />
                ))}
                <input
                  type="color"
                  value={textObj.color}
                  onChange={(e) => onUpdateObject({ ...textObj, color: e.target.value })}
                  className="color-custom-input"
                  title="Custom Color"
                />
              </div>
            </div>
          </>
        )}

        {/* 2. SHAPES PROPERTIES */}
        {shapeObj && (
          <>
            <div className="property-group">
              <label className="property-label">Select Shape</label>
              <div className="shape-selection-grid">
                {shapeChoices.map((choice) => (
                  <button
                    key={choice.id}
                    className={`shape-choice-btn ${shapeObj.type === choice.id ? 'active' : ''}`}
                    onClick={() => onUpdateObject({ ...shapeObj, type: choice.id })}
                    title={choice.label}
                  >
                    <span className="shape-icon">{choice.icon}</span>
                    <span className="shape-label">{choice.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Border Width</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={shapeObj.strokeWidth}
                  onChange={(e) => onUpdateObject({ ...shapeObj, strokeWidth: Math.max(0, Number(e.target.value) || 0) })}
                  className="property-number-input"
                  title="Border width in px (0 = borderless)"
                />
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={shapeObj.strokeWidth}
                onChange={(e) => onUpdateObject({ ...shapeObj, strokeWidth: Number(e.target.value) })}
                className="property-range"
              />
            </div>

            <div className="property-group">
              <label className="property-label">Border Color</label>
              <div className="color-palette-picker">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    className={`color-preset-circle ${shapeObj.strokeColor.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => onUpdateObject({ ...shapeObj, strokeColor: c })}
                  />
                ))}
                <input
                  type="color"
                  value={shapeObj.strokeColor.startsWith('#') ? shapeObj.strokeColor : '#00f0ff'}
                  onChange={(e) => onUpdateObject({ ...shapeObj, strokeColor: e.target.value })}
                  className="color-custom-input"
                  title="Custom Border Color"
                />
              </div>
            </div>

            {shapeObj.type !== 'line' && shapeObj.type !== 'arrow' && (
              <div className="property-group">
                <div className="property-label-row">
                  <label className="property-label">Fill Color</label>
                  <button
                    className={`btn-link ${shapeObj.fillColor === 'transparent' || !shapeObj.fillColor ? 'active-text' : ''}`}
                    onClick={() => onUpdateObject({ ...shapeObj, fillColor: 'transparent' })}
                  >
                    No Fill
                  </button>
                </div>
                <div className="color-palette-picker">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      className={`color-preset-circle ${shapeObj.fillColor?.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => onUpdateObject({ ...shapeObj, fillColor: c })}
                    />
                  ))}
                  <input
                    type="color"
                    value={shapeObj.fillColor && shapeObj.fillColor.startsWith('#') ? shapeObj.fillColor : '#ffffff'}
                    onChange={(e) => onUpdateObject({ ...shapeObj, fillColor: e.target.value })}
                    className="color-custom-input"
                    title="Custom Fill Color"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* 3. DRAWING PROPERTIES */}
        {drawingObj && (
          <>
            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Brush Size</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="100"
                  value={drawingObj.strokeWidth}
                  onChange={(e) => onUpdateObject({ ...drawingObj, strokeWidth: Math.max(0.5, Number(e.target.value) || 0.5) })}
                  className="property-number-input"
                />
              </div>
              <input
                type="range"
                min="0.5"
                max="60"
                step="0.5"
                value={drawingObj.strokeWidth}
                onChange={(e) => onUpdateObject({ ...drawingObj, strokeWidth: Number(e.target.value) })}
                className="property-range"
              />
            </div>

            <div className="property-group">
              <label className="property-label">Pen Color</label>
              <div className="color-palette-picker">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    className={`color-preset-circle ${drawingObj.strokeColor.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => onUpdateObject({ ...drawingObj, strokeColor: c })}
                  />
                ))}
                <input
                  type="color"
                  value={drawingObj.strokeColor.startsWith('#') ? drawingObj.strokeColor : '#00f0ff'}
                  onChange={(e) => onUpdateObject({ ...drawingObj, strokeColor: e.target.value })}
                  className="color-custom-input"
                  title="Custom Pen Color"
                />
              </div>
            </div>
          </>
        )}

        {/* 4. WATERMARK PROPERTIES (INCREASABLE LENGTH & CUSTOM TEXT) */}
        {watermarkObj && (
          <>
            <div className="property-group">
              <label className="property-label">Watermark Text</label>
              <input
                type="text"
                value={watermarkObj.text}
                onChange={(e) => onUpdateObject({ ...watermarkObj, text: e.target.value })}
                className="property-input"
                placeholder="e.g. CONFIDENTIAL / DRAFT"
              />
            </div>

            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Font Family</label>
                {documentFonts.length > 0 && (
                  <span className="property-value-badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    {documentFonts.length} in PDF
                  </span>
                )}
              </div>
              <select
                value={watermarkObj.fontFamily || STANDARD_FONTS[0].cssFamily}
                onChange={(e) => onUpdateObject({ ...watermarkObj, fontFamily: e.target.value })}
                className="property-select"
              >
                {documentFonts.length > 0 && (
                  <optgroup label="📄 From This Document">
                    {documentFonts.map((font) => (
                      <option key={`wm-doc-${font.id}`} value={font.cssFamily}>
                        {font.displayName}
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="🌐 Standard Fonts">
                  {STANDARD_FONTS.map((font) => (
                    <option key={`wm-std-${font.id}`} value={font.cssFamily}>
                      {font.displayName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Watermark Length / Width</label>
                <input
                  type="number"
                  min="0"
                  max="3000"
                  value={Math.round(watermarkObj.width)}
                  onChange={(e) => onUpdateObject({ ...watermarkObj, width: Math.max(0, Number(e.target.value) || 0) })}
                  className="property-number-input"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1800"
                step="10"
                value={Math.round(watermarkObj.width)}
                onChange={(e) => onUpdateObject({ ...watermarkObj, width: Number(e.target.value) })}
                className="property-range"
              />
              <span className="property-hint">Tip: Drag the edge handles on the canvas to stretch length freely.</span>
            </div>

            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Watermark Height</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={Math.round(watermarkObj.height)}
                  onChange={(e) => onUpdateObject({ ...watermarkObj, height: Math.max(0, Number(e.target.value) || 0) })}
                  className="property-number-input"
                />
              </div>
              <input
                type="range"
                min="0"
                max="600"
                step="5"
                value={Math.round(watermarkObj.height)}
                onChange={(e) => onUpdateObject({ ...watermarkObj, height: Number(e.target.value) })}
                className="property-range"
              />
            </div>

            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Font Size</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={watermarkObj.fontSize}
                  onChange={(e) => onUpdateObject({ ...watermarkObj, fontSize: Math.max(0, Number(e.target.value) || 0) })}
                  className="property-number-input"
                />
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={watermarkObj.fontSize}
                onChange={(e) => onUpdateObject({ ...watermarkObj, fontSize: Number(e.target.value) })}
                className="property-range"
              />
            </div>

            <div className="property-group">
              <label className="property-label">Watermark Color</label>
              <div className="color-palette-picker">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    className={`color-preset-circle ${watermarkObj.color.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => onUpdateObject({ ...watermarkObj, color: c })}
                  />
                ))}
                <input
                  type="color"
                  value={watermarkObj.color.startsWith('#') ? watermarkObj.color : '#ef4444'}
                  onChange={(e) => onUpdateObject({ ...watermarkObj, color: e.target.value })}
                  className="color-custom-input"
                  title="Custom Color"
                />
              </div>
            </div>
          </>
        )}

        {/* 5. REDACTION PROPERTIES */}
        {redactionObj && (
          <>
            <div className="redaction-info-box">
              <span className="info-icon">🛡️</span>
              <p>
                <strong>Permanent Redaction</strong> securely cuts and removes confidential text & graphics from the PDF file so they can never be recovered.
              </p>
            </div>

            <div className="property-group">
              <label className="property-label">Mask Color</label>
              <div className="color-palette-picker">
                {['#ffffff', '#000000', '#f8fafc', '#f1f5f9', '#fef08a'].map((c) => (
                  <button
                    key={c}
                    className={`color-preset-circle ${redactionObj.fillColor.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #666' : 'none' }}
                    onClick={() => onUpdateObject({ ...redactionObj, fillColor: c })}
                  />
                ))}
                <input
                  type="color"
                  value={redactionObj.fillColor}
                  onChange={(e) => onUpdateObject({ ...redactionObj, fillColor: e.target.value })}
                  className="color-custom-input"
                  title="Custom Mask Color"
                />
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                style={{ width: '100%', marginTop: '6px' }}
                onClick={() => {
                  const sampled = sampleCanvasBackgroundAtPdfPoint(
                    redactionObj.x + redactionObj.width / 2,
                    redactionObj.y + redactionObj.height / 2,
                    1.0
                  );
                  onUpdateObject({ ...redactionObj, fillColor: sampled });
                }}
              >
                🎯 Catch Background Color
              </button>
            </div>

            <div className="property-row">
              <div className="property-group flex-1">
                <div className="property-label-row">
                  <label className="property-label">Width</label>
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={Math.round(redactionObj.width)}
                    onChange={(e) => onUpdateObject({ ...redactionObj, width: Math.max(1, Number(e.target.value) || 1) })}
                    className="property-number-input"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={Math.round(redactionObj.width)}
                  onChange={(e) => onUpdateObject({ ...redactionObj, width: Number(e.target.value) })}
                  className="property-range"
                />
              </div>
              <div className="property-group flex-1">
                <div className="property-label-row">
                  <label className="property-label">Height</label>
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={Math.round(redactionObj.height)}
                    onChange={(e) => onUpdateObject({ ...redactionObj, height: Math.max(1, Number(e.target.value) || 1) })}
                    className="property-number-input"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="800"
                  value={Math.round(redactionObj.height)}
                  onChange={(e) => onUpdateObject({ ...redactionObj, height: Number(e.target.value) })}
                  className="property-range"
                />
              </div>
            </div>
          </>
        )}

        {/* WHITEOUT / ERASER MASK PROPERTIES */}
        {whiteoutObj && (
          <>
            <div className="redaction-info-box" style={{ background: 'rgba(0, 240, 255, 0.08)', borderColor: 'rgba(0, 240, 255, 0.3)' }}>
              <span className="info-icon">⬜</span>
              <p>
                <strong>Whiteout Eraser Layer</strong> covers and erases text seamlessly with a plain block that matches the page background. Position it over the old text, then use the <strong>Text tool (T)</strong> to write new text on top!
              </p>
            </div>

            <div className="property-group">
              <label className="property-label">Whiteout Color</label>
              <div className="color-palette-picker">
                {['#ffffff', '#f8fafc', '#f1f5f9', '#fef08a', '#fffbeb'].map((c) => (
                  <button
                    key={c}
                    className={`color-preset-circle ${whiteoutObj.fillColor.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #666' : 'none' }}
                    onClick={() => onUpdateObject({ ...whiteoutObj, fillColor: c })}
                  />
                ))}
                <input
                  type="color"
                  value={whiteoutObj.fillColor}
                  onChange={(e) => onUpdateObject({ ...whiteoutObj, fillColor: e.target.value })}
                  className="color-custom-input"
                  title="Custom Mask Color"
                />
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                style={{ width: '100%', marginTop: '6px' }}
                onClick={() => {
                  const sampled = sampleCanvasBackgroundAtPdfPoint(
                    whiteoutObj.x + whiteoutObj.width / 2,
                    whiteoutObj.y + whiteoutObj.height / 2,
                    1.0
                  );
                  onUpdateObject({ ...whiteoutObj, fillColor: sampled });
                }}
              >
                🎯 Catch Background Color
              </button>
            </div>

            <div className="property-row">
              <div className="property-group flex-1">
                <div className="property-label-row">
                  <label className="property-label">Width</label>
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={Math.round(whiteoutObj.width)}
                    onChange={(e) => onUpdateObject({ ...whiteoutObj, width: Math.max(1, Number(e.target.value) || 1) })}
                    className="property-number-input"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="1200"
                  value={Math.round(whiteoutObj.width)}
                  onChange={(e) => onUpdateObject({ ...whiteoutObj, width: Number(e.target.value) })}
                  className="property-range"
                />
              </div>
              <div className="property-group flex-1">
                <div className="property-label-row">
                  <label className="property-label">Height</label>
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={Math.round(whiteoutObj.height)}
                    onChange={(e) => onUpdateObject({ ...whiteoutObj, height: Math.max(1, Number(e.target.value) || 1) })}
                    className="property-number-input"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="800"
                  value={Math.round(whiteoutObj.height)}
                  onChange={(e) => onUpdateObject({ ...whiteoutObj, height: Number(e.target.value) })}
                  className="property-range"
                />
              </div>
            </div>
          </>
        )}

        {/* 6. SIGNATURE PROPERTIES */}
        {signatureObj && (
          <div className="property-group">
            <div className="property-label-row">
              <label className="property-label">Signature Width</label>
              <input
                type="number"
                min="5"
                max="2000"
                value={Math.round(signatureObj.width)}
                onChange={(e) => onUpdateObject({ ...signatureObj, width: Math.max(5, Number(e.target.value) || 5) })}
                className="property-number-input"
              />
            </div>
            <input
              type="range"
              min="5"
              max="800"
              value={Math.round(signatureObj.width)}
              onChange={(e) => onUpdateObject({ ...signatureObj, width: Number(e.target.value) })}
              className="property-range"
            />
          </div>
        )}

        {/* 7. ROTATION (UNIVERSAL) */}
        <div className="property-group">
          <div className="property-label-row">
            <label className="property-label">Rotation</label>
            <input
              type="number"
              min="0"
              max="360"
              value={selectedObject.rotation}
              onChange={(e) => onUpdateObject({ ...selectedObject, rotation: (Number(e.target.value) || 0) % 360 })}
              className="property-number-input"
            />
          </div>

          <div className="rotation-control-row">
            <input
              type="range"
              min="0"
              max="359"
              value={selectedObject.rotation}
              onChange={(e) => onUpdateObject({ ...selectedObject, rotation: Number(e.target.value) })}
              className="property-range"
            />
            <button 
              className="btn-icon" 
              onClick={handleRotate90} 
              title="Rotate 90° Clockwise"
            >
              <RotateIcon />
            </button>
          </div>

          <div className="rotation-presets-row">
            {[0, 45, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                className={`angle-preset-btn ${selectedObject.rotation === deg ? 'active' : ''}`}
                onClick={() => handleRotationStep(deg)}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* 8. OPACITY (UNIVERSAL) */}
        <div className="property-group">
          <div className="property-label-row">
            <label className="property-label">Opacity</label>
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round(selectedObject.opacity * 100)}
              onChange={(e) => onUpdateObject({ ...selectedObject, opacity: Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100 })}
              className="property-number-input"
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(selectedObject.opacity * 100)}
            onChange={(e) => onUpdateObject({ ...selectedObject, opacity: Number(e.target.value) / 100 })}
            className="property-range"
          />
        </div>
      </div>
    </aside>
  );
}
