import { PDFDocument, PDFName } from 'pdf-lib';
import type { PdfDoc } from './pdfRenderer';

export interface DocumentFontItem {
  id: string;
  displayName: string;
  cssFamily: string;
  baseFamily: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export const STANDARD_FONTS: DocumentFontItem[] = [
  { id: 'inter', displayName: 'Inter', cssFamily: 'Inter, sans-serif', baseFamily: 'Inter' },
  { id: 'arial', displayName: 'Arial', cssFamily: 'Arial, Helvetica, sans-serif', baseFamily: 'Arial' },
  { id: 'times', displayName: 'Times New Roman', cssFamily: "'Times New Roman', Times, serif", baseFamily: 'Times New Roman' },
  { id: 'courier', displayName: 'Courier New', cssFamily: "'Courier New', Courier, monospace", baseFamily: 'Courier New' },
  { id: 'georgia', displayName: 'Georgia', cssFamily: 'Georgia, serif', baseFamily: 'Georgia' },
  { id: 'cambria', displayName: 'Cambria', cssFamily: 'Cambria, Georgia, serif', baseFamily: 'Cambria' },
  { id: 'calibri', displayName: 'Calibri', cssFamily: 'Calibri, Arial, sans-serif', baseFamily: 'Calibri' },
  { id: 'helvetica', displayName: 'Helvetica', cssFamily: 'Helvetica, Arial, sans-serif', baseFamily: 'Helvetica' },
  { id: 'verdana', displayName: 'Verdana', cssFamily: 'Verdana, Geneva, sans-serif', baseFamily: 'Verdana' },
  { id: 'impact', displayName: 'Impact', cssFamily: 'Impact, Charcoal, sans-serif', baseFamily: 'Impact' },
];

/**
 * Normalizes a raw PDF font name (e.g. "/ABCDEF+TimesNewRomanPS-BoldMT" or "Helvetica-Oblique")
 * into a clean display name, base family, and web-safe CSS font family.
 */
export function normalizeFontName(rawFont: string): DocumentFontItem | null {
  if (!rawFont || typeof rawFont !== 'string') return null;

  // Filter out PDF.js internal IDs (like g_d0_f1)
  if (/^g_d\d+_f\d+$/i.test(rawFont) || rawFont.startsWith('g_d')) return null;

  // Remove leading slash and 6-letter subset tag (e.g. "/ABCDEF+Calibri" -> "Calibri")
  let clean = rawFont.replace(/^\//, '').replace(/^[A-Z]{6}\+/, '').trim();
  clean = clean.replace(/#20/g, ' ').replace(/#/g, '');

  if (!clean || clean.length < 2) return null;

  const isBold = /bold|black|heavy|semibold/i.test(clean);
  const isItalic = /italic|oblique/i.test(clean);

  // Strip common PostScript suffixes: PSMT, PS, MT, -Regular, -Roman
  let readable = clean
    .replace(/(?:PSMT|PS|MT)$/i, '')
    .replace(/-(?:Regular|Roman)$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim();

  // If name became empty, fallback to clean
  if (!readable) readable = clean;

  // Detect proper font category
  let fallback = 'sans-serif';
  if (/times|roman|georgia|cambria|serif|garamond|palatino|baskerville|minion/i.test(readable)) {
    fallback = 'serif';
  } else if (/courier|mono|code|consolas|menlo|typewriter/i.test(readable)) {
    fallback = 'monospace';
  }

  // Base family without the bold/italic word
  const baseFamily = readable
    .replace(/\s+(?:Bold|Italic|Oblique|Semibold|Medium|Regular|Roman|Light)/gi, '')
    .trim() || readable;

  const cssFamily = `'${baseFamily}', ${fallback}`;

  return {
    id: clean.toLowerCase().replace(/\s+/g, '-'),
    displayName: readable,
    baseFamily,
    cssFamily,
    isBold,
    isItalic,
  };
}

/**
 * Extracts all unique fonts used across the PDF document using both:
 * 1. Deep PDF dictionary inspection via pdf-lib (Resources -> Font -> BaseFont).
 * 2. Rendered text style dictionary via pdfjs-dist.
 */
export async function extractFontsFromPdf(
  arrayBuffer: ArrayBuffer,
  pdfJsDoc?: PdfDoc | null
): Promise<DocumentFontItem[]> {
  const fontMap = new Map<string, DocumentFontItem>();

  // 1. Extract from PDF binary structure via pdf-lib
  try {
    const pdfDocLib = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDocLib.getPages();

    for (const page of pages) {
      const resources = page.node.Resources();
      if (!resources) continue;

      const fontDict = resources.lookup(PDFName.of('Font'));
      if (fontDict && typeof (fontDict as any).entries === 'function') {
        for (const [key] of (fontDict as any).entries()) {
          try {
            const fontObj = (fontDict as any).lookup(key);
            if (fontObj && typeof (fontObj as any).lookup === 'function') {
              // Direct BaseFont
              const baseFont = (fontObj as any).lookup(PDFName.of('BaseFont'));
              if (baseFont) {
                const nameStr = baseFont.encodedName || baseFont.toString();
                const item = normalizeFontName(nameStr);
                if (item && !fontMap.has(item.displayName.toLowerCase())) {
                  fontMap.set(item.displayName.toLowerCase(), item);
                }
              }

              // DescendantFonts for Type0 CID fonts
              const descFonts = (fontObj as any).lookup(PDFName.of('DescendantFonts'));
              if (descFonts && typeof (descFonts as any).asArray === 'function') {
                for (const dfRef of (descFonts as any).asArray()) {
                  const dfObj = (fontObj as any).context.lookup(dfRef);
                  if (dfObj && typeof dfObj.lookup === 'function') {
                    const dfBaseFont = dfObj.lookup(PDFName.of('BaseFont'));
                    if (dfBaseFont) {
                      const dfNameStr = dfBaseFont.encodedName || dfBaseFont.toString();
                      const item = normalizeFontName(dfNameStr);
                      if (item && !fontMap.has(item.displayName.toLowerCase())) {
                        fontMap.set(item.displayName.toLowerCase(), item);
                      }
                    }
                  }
                }
              }
            }
          } catch {
            // Ignore individual font read errors
          }
        }
      }
    }
  } catch (err) {
    console.warn('pdf-lib font extraction error:', err);
  }

  // 2. Extract from PDF.js text layer styles
  if (pdfJsDoc) {
    try {
      const maxPagesToCheck = Math.min(pdfJsDoc.numPages, 10);
      for (let p = 1; p <= maxPagesToCheck; p++) {
        const page = await pdfJsDoc.getPage(p);
        const textContent = await page.getTextContent();
        if (textContent && textContent.styles) {
          for (const styleKey in textContent.styles) {
            const style = textContent.styles[styleKey];
            if (style && style.fontFamily) {
              const item = normalizeFontName(style.fontFamily);
              if (item && !fontMap.has(item.displayName.toLowerCase())) {
                fontMap.set(item.displayName.toLowerCase(), item);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('pdfjs font extraction error:', err);
    }
  }

  return Array.from(fontMap.values());
}
