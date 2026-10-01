import React, { useRef, useState } from 'react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
}

export default function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#000000');
  const [penWidth, setPenWidth] = useState<number>(3);

  // Type state
  const [typedName, setTypedName] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>('Dancing Script, cursive');
  const [typedColor, setTypedColor] = useState<string>('#000000');

  // Upload state
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  // Clear drawing canvas
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Generate PNG from typed text
  const generateTypedSignature = (): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 600;
    offscreen.height = 200;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = typedColor;
    ctx.font = `64px ${selectedFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Signature', offscreen.width / 2, offscreen.height / 2);

    return offscreen.toDataURL('image/png');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUploadedDataUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onSave(canvas.toDataURL('image/png'));
    } else if (tab === 'type') {
      if (!typedName.trim()) return;
      const dataUrl = generateTypedSignature();
      onSave(dataUrl);
    } else if (tab === 'upload') {
      if (!uploadedDataUrl) return;
      onSave(uploadedDataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="signature-modal-backdrop" onClick={onClose}>
      <div className="signature-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="signature-modal-header">
          <h3>Create Signature</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="signature-tabs">
          <button
            className={`signature-tab-btn ${tab === 'draw' ? 'active' : ''}`}
            onClick={() => setTab('draw')}
          >
            ✍ Draw
          </button>
          <button
            className={`signature-tab-btn ${tab === 'type' ? 'active' : ''}`}
            onClick={() => setTab('type')}
          >
            ⌨ Type
          </button>
          <button
            className={`signature-tab-btn ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            📁 Upload
          </button>
        </div>

        {/* Tab 1: Draw */}
        {tab === 'draw' && (
          <div className="signature-draw-pane">
            <div className="signature-canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="signature-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="signature-canvas-placeholder">
                  Sign here using your mouse or finger
                </div>
              )}
            </div>

            <div className="signature-tools-row">
              <div className="pen-color-options">
                {['#000000', '#1d4ed8', '#15803d'].map((color) => (
                  <button
                    key={color}
                    className={`color-preset-circle ${penColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPenColor(color)}
                  />
                ))}
              </div>
              <div className="pen-width-options">
                <label className="property-label" style={{ margin: 0 }}>Stroke:</label>
                {[2, 3, 5].map((w) => (
                  <button
                    key={w}
                    className={`style-toggle-btn ${penWidth === w ? 'active' : ''}`}
                    onClick={() => setPenWidth(w)}
                  >
                    {w}px
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={handleClearCanvas}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Type */}
        {tab === 'type' && (
          <div className="signature-type-pane">
            <div className="property-group">
              <label className="property-label">Type Your Full Name</label>
              <input
                type="text"
                className="property-input"
                placeholder="e.g. Jane Doe"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="property-group">
              <label className="property-label">Select Style</label>
              <div className="typed-font-choices">
                {[
                  { name: 'Dancing Script', font: "'Dancing Script', cursive" },
                  { name: 'Brush Script', font: "'Brush Script MT', cursive" },
                  { name: 'Classic Script', font: "'Great Vibes', cursive, 'Times New Roman'" },
                ].map((f) => (
                  <div
                    key={f.name}
                    className={`font-choice-card ${selectedFont === f.font ? 'active' : ''}`}
                    onClick={() => setSelectedFont(f.font)}
                    style={{ fontFamily: f.font }}
                  >
                    <span className="font-choice-preview">
                      {typedName.trim() || 'Your Signature'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="property-group">
              <label className="property-label">Color</label>
              <div className="pen-color-options">
                {['#000000', '#1d4ed8', '#15803d'].map((color) => (
                  <button
                    key={color}
                    className={`color-preset-circle ${typedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTypedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Upload */}
        {tab === 'upload' && (
          <div className="signature-upload-pane">
            <div className="signature-upload-box">
              {uploadedDataUrl ? (
                <div className="signature-preview-uploaded">
                  <img src={uploadedDataUrl} alt="Signature Preview" />
                  <button
                    className="btn btn--secondary btn--small"
                    onClick={() => setUploadedDataUrl(null)}
                    style={{ marginTop: '12px' }}
                  >
                    Replace Image
                  </button>
                </div>
              ) : (
                <label className="signature-file-dropzone">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="dropzone-content">
                    <span className="upload-icon">📤</span>
                    <p>Click to upload a transparent PNG or signature photo</p>
                    <span className="upload-note">PNG, JPG, WEBP, or SVG</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="signature-modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={
              (tab === 'draw' && !hasDrawn) ||
              (tab === 'type' && !typedName.trim()) ||
              (tab === 'upload' && !uploadedDataUrl)
            }
          >
            Insert Signature
          </button>
        </div>
      </div>
    </div>
  );
}
