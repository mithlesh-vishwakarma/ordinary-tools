import type { EditorObject, TextObject } from './types';
import { RotateIcon, TrashIcon, CopyIcon } from '../Icons';

interface PdfPropertiesPanelProps {
  selectedObject: EditorObject | null;
  onUpdateObject: (updated: EditorObject) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
}

export default function PdfPropertiesPanel({
  selectedObject,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
}: PdfPropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <aside className="workspace-properties-panel glass-card">
        <div className="panel-section-title">Properties</div>
        <div className="properties-empty">
          <p>Click on an element on the canvas to inspect and edit its properties.</p>
        </div>
      </aside>
    );
  }

  const isText = selectedObject.type === 'text';
  const textObj = isText ? (selectedObject as TextObject) : null;

  const fontOptions = [
    'Inter, sans-serif',
    'Arial, sans-serif',
    'Times New Roman, serif',
    'Courier New, monospace',
    'Georgia, serif',
    'Impact, sans-serif',
  ];

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

        {/* TEXT SPECIFIC PROPERTIES */}
        {textObj && (
          <>
            {/* Text Value */}
            <div className="property-group">
              <label className="property-label">Text Content</label>
              <textarea
                value={textObj.text}
                onChange={(e) => onUpdateObject({ ...textObj, text: e.target.value })}
                className="property-textarea"
                rows={2}
              />
            </div>

            {/* Font Family */}
            <div className="property-group">
              <label className="property-label">Font Family</label>
              <select
                value={textObj.fontFamily}
                onChange={(e) => onUpdateObject({ ...textObj, fontFamily: e.target.value })}
                className="property-select"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Alignment */}
            <div className="property-row">
              <div className="property-group flex-1">
                <label className="property-label">Font Size ({textObj.fontSize}px)</label>
                <input
                  type="range"
                  min="10"
                  max="72"
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

            {/* Formatting (Bold, Italic, Underline) */}
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

            {/* Color Palette */}
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

        {/* ROTATION (REQUIRED - FREELY ROTATE & PRESETS) */}
        <div className="property-group">
          <div className="property-label-row">
            <label className="property-label">Rotation</label>
            <span className="property-value-badge">{selectedObject.rotation}°</span>
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

          {/* Quick Rotation Angle Presets */}
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

        {/* OPACITY */}
        <div className="property-group">
          <div className="property-label-row">
            <label className="property-label">Opacity</label>
            <span className="property-value-badge">{Math.round(selectedObject.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="10"
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
