import { useState, useRef, useId } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { 
  PdfIcon, 
  MergeIcon, 
  SplitIcon, 
  RotateIcon, 
  TrashIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  DownloadIcon, 
  ShieldCheckIcon 
} from '../components/Icons';
import { PDFDocument, degrees } from 'pdf-lib';

type Tab = 'merge' | 'split' | 'rotate' | 'inspect';

interface UploadedPdfItem {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  file: File;
  arrayBuffer: ArrayBuffer;
}

export default function PdfEditor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'merge';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<UploadedPdfItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Split state
  const [splitFile, setSplitFile] = useState<UploadedPdfItem | null>(null);
  const [pageRange, setPageRange] = useState('1');
  const splitInputRef = useRef<HTMLInputElement>(null);

  // Rotate state
  const [rotateFile, setRotateFile] = useState<UploadedPdfItem | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [rotateTarget, setRotateTarget] = useState<'all' | 'custom'>('all');
  const [rotatePages, setRotatePages] = useState('1');
  const rotateInputRef = useRef<HTMLInputElement>(null);

  // Inspect state
  const [inspectFile, setInspectFile] = useState<UploadedPdfItem | null>(null);
  const [metadata, setMetadata] = useState<{
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    pageCount: number;
    pageSize: string;
  } | null>(null);
  const inspectInputRef = useRef<HTMLInputElement>(null);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setStatusMessage(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to read and parse PDF
  const loadPdfItem = async (file: File): Promise<UploadedPdfItem> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      pageCount,
      file,
      arrayBuffer,
    };
  };

  // Trigger file download
  const downloadBlob = (bytes: Uint8Array, filename: string) => {
    // Create a copy of the bytes to ensure a standard ArrayBuffer backing
    const bufferCopy = new Uint8Array(bytes).buffer;
    const blob = new Blob([bufferCopy], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // 1. MERGE HANDLERS
  const handleMergeFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const newItems: UploadedPdfItem[] = [];
      for (const file of Array.from(e.target.files)) {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const item = await loadPdfItem(file);
          newItems.push(item);
        }
      }
      setMergeFiles(prev => [...prev, ...newItems]);
      setStatusMessage({ type: 'info', text: `Added ${newItems.length} PDF file(s).` });
    } catch {
      setStatusMessage({ type: 'error', text: 'Error loading one or more PDF files. Make sure they are not encrypted.' });
    } finally {
      setIsProcessing(false);
      if (mergeInputRef.current) mergeInputRef.current.value = '';
    }
  };

  const moveMergeItem = (index: number, direction: 'up' | 'down') => {
    setMergeFiles(prev => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const removeMergeItem = (id: string) => {
    setMergeFiles(prev => prev.filter(f => f.id !== id));
  };

  const executeMerge = async () => {
    if (mergeFiles.length < 2) {
      setStatusMessage({ type: 'error', text: 'Please add at least 2 PDF files to merge.' });
      return;
    }
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const doc = await PDFDocument.load(item.arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
      }
      const pdfBytes = await mergedPdf.save();
      downloadBlob(pdfBytes, 'ordinarytools-merged.pdf');
      setStatusMessage({ type: 'success', text: `Successfully merged ${mergeFiles.length} files (${mergedPdf.getPageCount()} pages total)!` });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to merge PDFs. Please check file validity.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse page range string e.g. "1-3, 5, 7-9" -> 0-based indices
  const parsePageIndices = (input: string, totalPages: number): number[] => {
    const indices = new Set<number>();
    const parts = input.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => parseInt(s.trim(), 10));
        if (!isNaN(startStr) && !isNaN(endStr)) {
          const start = Math.max(1, Math.min(startStr, endStr));
          const end = Math.min(totalPages, Math.max(startStr, endStr));
          for (let p = start; p <= end; p++) {
            indices.add(p - 1);
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          indices.add(pageNum - 1);
        }
      }
    }
    return Array.from(indices).sort((a, b) => a - b);
  };

  // 2. SPLIT HANDLERS
  const handleSplitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const item = await loadPdfItem(file);
      setSplitFile(item);
      setPageRange(`1-${item.pageCount}`);
      setStatusMessage(null);
    } catch {
      setStatusMessage({ type: 'error', text: 'Could not load PDF. It may be corrupt or encrypted.' });
    }
  };

  const executeSplit = async () => {
    if (!splitFile) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const srcDoc = await PDFDocument.load(splitFile.arrayBuffer);
      const indices = parsePageIndices(pageRange, splitFile.pageCount);
      if (indices.length === 0) {
        setStatusMessage({ type: 'error', text: `Please provide valid page numbers between 1 and ${splitFile.pageCount}.` });
        setIsProcessing(false);
        return;
      }
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcDoc, indices);
      copiedPages.forEach(p => newPdf.addPage(p));
      const pdfBytes = await newPdf.save();
      downloadBlob(pdfBytes, `ordinarytools-extracted-${pageRange.replace(/\s+/g, '')}.pdf`);
      setStatusMessage({ type: 'success', text: `Extracted ${indices.length} page(s) successfully!` });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to extract pages from PDF.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. ROTATE HANDLERS
  const handleRotateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const item = await loadPdfItem(file);
      setRotateFile(item);
      setRotatePages(`1-${item.pageCount}`);
      setStatusMessage(null);
    } catch {
      setStatusMessage({ type: 'error', text: 'Could not load PDF.' });
    }
  };

  const executeRotate = async () => {
    if (!rotateFile) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const doc = await PDFDocument.load(rotateFile.arrayBuffer);
      const total = doc.getPageCount();
      const targetIndices = rotateTarget === 'all' 
        ? doc.getPageIndices() 
        : parsePageIndices(rotatePages, total);

      if (targetIndices.length === 0) {
        setStatusMessage({ type: 'error', text: 'No matching pages to rotate.' });
        setIsProcessing(false);
        return;
      }

      for (const idx of targetIndices) {
        const page = doc.getPage(idx);
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationAngle) % 360));
      }

      const pdfBytes = await doc.save();
      downloadBlob(pdfBytes, `ordinarytools-rotated-${rotationAngle}deg.pdf`);
      setStatusMessage({ type: 'success', text: `Rotated ${targetIndices.length} page(s) by ${rotationAngle}°!` });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to rotate PDF.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. INSPECT HANDLERS
  const handleInspectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const item = await loadPdfItem(file);
      setInspectFile(item);
      const doc = await PDFDocument.load(item.arrayBuffer);
      const pages = doc.getPages();
      const firstPage = pages[0];
      const sizeStr = firstPage ? `${Math.round(firstPage.getWidth())} × ${Math.round(firstPage.getHeight())} pt` : 'Unknown';

      setMetadata({
        title: doc.getTitle() || 'Untitled',
        author: doc.getAuthor() || 'Unknown',
        subject: doc.getSubject() || 'None',
        creator: doc.getCreator() || 'Unknown',
        producer: doc.getProducer() || 'Unknown',
        creationDate: doc.getCreationDate() ? doc.getCreationDate()?.toLocaleDateString() : 'Unknown',
        pageCount: doc.getPageCount(),
        pageSize: sizeStr
      });
      setStatusMessage(null);
    } catch {
      setStatusMessage({ type: 'error', text: 'Could not inspect PDF metadata.' });
    }
  };

  const mergeUploadId = useId();
  const splitUploadId = useId();
  const rotateUploadId = useId();
  const inspectUploadId = useId();

  return (
    <div className="pdf-editor-page animate-fade-in-up">
      <Header tagline="Powerful Tools for Everyday Work" />

      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="hub-breadcrumbs">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/tools" className="breadcrumb-link">Tools</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">PDF Editor</span>
        </div>

        {/* Hero Banner */}
        <div className="header__hero">
          <div className="subtool-pill subtool-pill--cyan">
            <ShieldCheckIcon />
            <span>100% PRIVATE CLIENT-SIDE PROCESSING</span>
          </div>
          <h1 className="header__title">PDF Editor Suite</h1>
          <p className="header__subtitle">
            Merge, split, rotate, and inspect PDF files completely in your browser.
            Your confidential files are never uploaded to any server.
          </p>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div className={`status-banner status-banner--${statusMessage.type} glass-card`}>
            <span>{statusMessage.text}</span>
            <button className="status-close" onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="pdf-tabs-nav glass-card">
          <button 
            className={`pdf-tab-btn ${activeTab === 'merge' ? 'active' : ''}`}
            onClick={() => switchTab('merge')}
          >
            <MergeIcon />
            <span>Merge PDFs</span>
          </button>
          <button 
            className={`pdf-tab-btn ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => switchTab('split')}
          >
            <SplitIcon />
            <span>Split & Extract</span>
          </button>
          <button 
            className={`pdf-tab-btn ${activeTab === 'rotate' ? 'active' : ''}`}
            onClick={() => switchTab('rotate')}
          >
            <RotateIcon />
            <span>Rotate Pages</span>
          </button>
          <button 
            className={`pdf-tab-btn ${activeTab === 'inspect' ? 'active' : ''}`}
            onClick={() => switchTab('inspect')}
          >
            <PdfIcon />
            <span>PDF Inspector</span>
          </button>
        </div>

        {/* TAB 1: MERGE */}
        {activeTab === 'merge' && (
          <div className="pdf-panel glass-card">
            <div className="pdf-panel__header">
              <div className="pdf-panel__title-box">
                <MergeIcon />
                <h2>Merge Multiple PDFs</h2>
              </div>
              <p className="pdf-panel__subtitle">
                Select 2 or more PDF documents, arrange them in your preferred sequence, and combine them into a single file.
              </p>
            </div>

            {/* Drop / Upload Zone */}
            <div 
              className="pdf-dropzone" 
              onClick={() => mergeInputRef.current?.click()}
            >
              <input 
                id={mergeUploadId}
                ref={mergeInputRef} 
                type="file" 
                multiple 
                accept="application/pdf" 
                style={{ display: 'none' }}
                onChange={handleMergeFilesUpload}
              />
              <div className="pdf-dropzone__icon">
                <MergeIcon />
              </div>
              <h3 className="pdf-dropzone__title">Click or Drop PDF files here</h3>
              <p className="pdf-dropzone__hint">Supports multiple PDF files of any size</p>
            </div>

            {/* Uploaded File List */}
            {mergeFiles.length > 0 && (
              <div className="pdf-file-list">
                <div className="pdf-file-list__header">
                  <span>Queued Documents ({mergeFiles.length})</span>
                  <button 
                    onClick={() => setMergeFiles([])} 
                    className="btn btn--small btn--ghost"
                  >
                    Clear All
                  </button>
                </div>

                {mergeFiles.map((item, idx) => (
                  <div key={item.id} className="pdf-file-row">
                    <div className="pdf-file-row__index">{idx + 1}</div>
                    <div className="pdf-file-row__icon"><PdfIcon /></div>
                    <div className="pdf-file-row__details">
                      <div className="pdf-file-row__name">{item.name}</div>
                      <div className="pdf-file-row__meta">
                        {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} • {formatFileSize(item.size)}
                      </div>
                    </div>
                    <div className="pdf-file-row__actions">
                      <button 
                        onClick={() => moveMergeItem(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="btn-icon"
                      >
                        <ArrowUpIcon />
                      </button>
                      <button 
                        onClick={() => moveMergeItem(idx, 'down')}
                        disabled={idx === mergeFiles.length - 1}
                        title="Move Down"
                        className="btn-icon"
                      >
                        <ArrowDownIcon />
                      </button>
                      <button 
                        onClick={() => removeMergeItem(item.id)}
                        title="Remove File"
                        className="btn-icon btn-icon--danger"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pdf-panel__actions">
                  <button 
                    onClick={() => mergeInputRef.current?.click()} 
                    className="btn btn--secondary"
                  >
                    + Add More PDFs
                  </button>
                  <button 
                    onClick={executeMerge} 
                    disabled={mergeFiles.length < 2 || isProcessing}
                    className="btn btn--primary"
                  >
                    <DownloadIcon />
                    <span>{isProcessing ? 'Merging...' : `Merge & Download (${mergeFiles.reduce((acc, f) => acc + f.pageCount, 0)} pages)`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SPLIT & EXTRACT */}
        {activeTab === 'split' && (
          <div className="pdf-panel glass-card">
            <div className="pdf-panel__header">
              <div className="pdf-panel__title-box">
                <SplitIcon />
                <h2>Split & Extract PDF Pages</h2>
              </div>
              <p className="pdf-panel__subtitle">
                Extract specific pages or page ranges from a document into a brand new PDF.
              </p>
            </div>

            {!splitFile ? (
              <div 
                className="pdf-dropzone" 
                onClick={() => splitInputRef.current?.click()}
              >
                <input 
                  id={splitUploadId}
                  ref={splitInputRef} 
                  type="file" 
                  accept="application/pdf" 
                  style={{ display: 'none' }}
                  onChange={handleSplitUpload}
                />
                <div className="pdf-dropzone__icon">
                  <SplitIcon />
                </div>
                <h3 className="pdf-dropzone__title">Select a PDF to Split</h3>
                <p className="pdf-dropzone__hint">Click to browse your computer</p>
              </div>
            ) : (
              <div className="pdf-config-box">
                <div className="pdf-selected-file">
                  <div className="pdf-file-row__icon"><PdfIcon /></div>
                  <div className="pdf-file-row__details">
                    <div className="pdf-file-row__name">{splitFile.name}</div>
                    <div className="pdf-file-row__meta">
                      Total Pages: <strong>{splitFile.pageCount}</strong> • {formatFileSize(splitFile.size)}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSplitFile(null)} 
                    className="btn btn--small btn--ghost"
                  >
                    Change File
                  </button>
                </div>

                <div className="pdf-range-input-group">
                  <label htmlFor="extract-page-range" className="pdf-input-label">
                    Page Range to Extract:
                    <span className="pdf-input-hint"> (e.g. 1-3, 5, 8-10)</span>
                  </label>
                  <input 
                    id="extract-page-range"
                    type="text" 
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. 1-3, 5"
                    className="pdf-text-input"
                  />
                  <div className="page-range-quick-tags">
                    <button 
                      className="tag-btn"
                      onClick={() => setPageRange(`1`)}
                    >
                      First Page
                    </button>
                    <button 
                      className="tag-btn"
                      onClick={() => setPageRange(`${splitFile.pageCount}`)}
                    >
                      Last Page
                    </button>
                    <button 
                      className="tag-btn"
                      onClick={() => setPageRange(`1-${Math.ceil(splitFile.pageCount / 2)}`)}
                    >
                      First Half (1-{Math.ceil(splitFile.pageCount / 2)})
                    </button>
                    <button 
                      className="tag-btn"
                      onClick={() => setPageRange(`1-${splitFile.pageCount}`)}
                    >
                      All Pages
                    </button>
                  </div>
                </div>

                <div className="pdf-panel__actions">
                  <button 
                    onClick={executeSplit} 
                    disabled={isProcessing || !pageRange.trim()}
                    className="btn btn--primary"
                  >
                    <DownloadIcon />
                    <span>{isProcessing ? 'Extracting...' : 'Extract & Download PDF'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROTATE */}
        {activeTab === 'rotate' && (
          <div className="pdf-panel glass-card">
            <div className="pdf-panel__header">
              <div className="pdf-panel__title-box">
                <RotateIcon />
                <h2>Rotate PDF Pages</h2>
              </div>
              <p className="pdf-panel__subtitle">
                Fix sideways or upside-down pages by rotating them clockwise or counter-clockwise.
              </p>
            </div>

            {!rotateFile ? (
              <div 
                className="pdf-dropzone" 
                onClick={() => rotateInputRef.current?.click()}
              >
                <input 
                  id={rotateUploadId}
                  ref={rotateInputRef} 
                  type="file" 
                  accept="application/pdf" 
                  style={{ display: 'none' }}
                  onChange={handleRotateUpload}
                />
                <div className="pdf-dropzone__icon">
                  <RotateIcon />
                </div>
                <h3 className="pdf-dropzone__title">Select a PDF to Rotate</h3>
                <p className="pdf-dropzone__hint">Click to browse your computer</p>
              </div>
            ) : (
              <div className="pdf-config-box">
                <div className="pdf-selected-file">
                  <div className="pdf-file-row__icon"><PdfIcon /></div>
                  <div className="pdf-file-row__details">
                    <div className="pdf-file-row__name">{rotateFile.name}</div>
                    <div className="pdf-file-row__meta">
                      Total Pages: <strong>{rotateFile.pageCount}</strong> • {formatFileSize(rotateFile.size)}
                    </div>
                  </div>
                  <button 
                    onClick={() => setRotateFile(null)} 
                    className="btn btn--small btn--ghost"
                  >
                    Change File
                  </button>
                </div>

                <div className="rotate-controls-grid">
                  <div className="rotate-control-block">
                    <label className="pdf-input-label">Rotation Angle:</label>
                    <div className="angle-picker">
                      <button 
                        className={`angle-btn ${rotationAngle === 90 ? 'active' : ''}`}
                        onClick={() => setRotationAngle(90)}
                      >
                        90° Clockwise
                      </button>
                      <button 
                        className={`angle-btn ${rotationAngle === 180 ? 'active' : ''}`}
                        onClick={() => setRotationAngle(180)}
                      >
                        180° Flip
                      </button>
                      <button 
                        className={`angle-btn ${rotationAngle === 270 ? 'active' : ''}`}
                        onClick={() => setRotationAngle(270)}
                      >
                        270° (90° CCW)
                      </button>
                    </div>
                  </div>

                  <div className="rotate-control-block">
                    <label className="pdf-input-label">Apply To:</label>
                    <div className="angle-picker">
                      <button 
                        className={`angle-btn ${rotateTarget === 'all' ? 'active' : ''}`}
                        onClick={() => setRotateTarget('all')}
                      >
                        All Pages
                      </button>
                      <button 
                        className={`angle-btn ${rotateTarget === 'custom' ? 'active' : ''}`}
                        onClick={() => setRotateTarget('custom')}
                      >
                        Custom Pages
                      </button>
                    </div>

                    {rotateTarget === 'custom' && (
                      <div style={{ marginTop: '12px' }}>
                        <input 
                          type="text"
                          value={rotatePages}
                          onChange={(e) => setRotatePages(e.target.value)}
                          placeholder="e.g. 1, 3-5"
                          className="pdf-text-input"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pdf-panel__actions">
                  <button 
                    onClick={executeRotate} 
                    disabled={isProcessing}
                    className="btn btn--primary"
                  >
                    <DownloadIcon />
                    <span>{isProcessing ? 'Rotating...' : `Rotate & Download PDF`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INSPECT */}
        {activeTab === 'inspect' && (
          <div className="pdf-panel glass-card">
            <div className="pdf-panel__header">
              <div className="pdf-panel__title-box">
                <PdfIcon />
                <h2>PDF Document Inspector</h2>
              </div>
              <p className="pdf-panel__subtitle">
                Examine technical metadata, creation timestamps, author information, and page dimensions.
              </p>
            </div>

            {!inspectFile ? (
              <div 
                className="pdf-dropzone" 
                onClick={() => inspectInputRef.current?.click()}
              >
                <input 
                  id={inspectUploadId}
                  ref={inspectInputRef} 
                  type="file" 
                  accept="application/pdf" 
                  style={{ display: 'none' }}
                  onChange={handleInspectUpload}
                />
                <div className="pdf-dropzone__icon">
                  <PdfIcon />
                </div>
                <h3 className="pdf-dropzone__title">Select a PDF to Inspect</h3>
                <p className="pdf-dropzone__hint">Click to browse your computer</p>
              </div>
            ) : (
              <div className="pdf-config-box">
                <div className="pdf-selected-file">
                  <div className="pdf-file-row__icon"><PdfIcon /></div>
                  <div className="pdf-file-row__details">
                    <div className="pdf-file-row__name">{inspectFile.name}</div>
                    <div className="pdf-file-row__meta">
                      Size: {formatFileSize(inspectFile.size)}
                    </div>
                  </div>
                  <button 
                    onClick={() => { setInspectFile(null); setMetadata(null); }} 
                    className="btn btn--small btn--ghost"
                  >
                    Select Another
                  </button>
                </div>

                {metadata && (
                  <div className="metadata-table-wrapper">
                    <table className="metadata-table">
                      <tbody>
                        <tr>
                          <td>Document Title:</td>
                          <td><strong>{metadata.title}</strong></td>
                        </tr>
                        <tr>
                          <td>Author:</td>
                          <td>{metadata.author}</td>
                        </tr>
                        <tr>
                          <td>Page Count:</td>
                          <td><span className="badge badge--cyan">{metadata.pageCount} pages</span></td>
                        </tr>
                        <tr>
                          <td>Page Dimensions:</td>
                          <td>{metadata.pageSize}</td>
                        </tr>
                        <tr>
                          <td>Creator Application:</td>
                          <td>{metadata.creator}</td>
                        </tr>
                        <tr>
                          <td>PDF Producer:</td>
                          <td>{metadata.producer}</td>
                        </tr>
                        <tr>
                          <td>Created Date:</td>
                          <td>{metadata.creationDate}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px' }}>
          <Link to="/tools" className="btn btn--secondary">
            ← Back to All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
