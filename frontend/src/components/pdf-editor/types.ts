export type ObjectType = 
  | 'text' 
  | 'whiteout'
  | 'image' 
  | 'signature' 
  | 'rectangle' 
  | 'rounded-rect'
  | 'circle' 
  | 'line' 
  | 'arrow' 
  | 'triangle'
  | 'star'
  | 'drawing' 
  | 'highlight' 
  | 'watermark' 
  | 'redaction';

export interface BaseEditorObject {
  id: string;
  type: ObjectType;
  page: number; // 1-indexed

  x: number; // in PDF points (relative to page)
  y: number; // in PDF points (relative to page)

  width: number;
  height: number;

  rotation: number; // in degrees (0 - 360)
  opacity: number;  // 0 - 1
}

export interface TextObject extends BaseEditorObject {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageObject extends BaseEditorObject {
  type: 'image';
  src: string; // base64 or object URL
  aspectRatio: number;
}

export interface ShapeObject extends BaseEditorObject {
  type: 'rectangle' | 'rounded-rect' | 'circle' | 'line' | 'arrow' | 'triangle' | 'star';
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingObject extends BaseEditorObject {
  type: 'drawing' | 'highlight';
  points: DrawingPoint[];
  strokeColor: string;
  strokeWidth: number;
}

export interface SignatureObject extends BaseEditorObject {
  type: 'signature';
  signatureDataUrl: string;
}

export interface WatermarkObject extends BaseEditorObject {
  type: 'watermark';
  text: string;
  fontFamily?: string;
  fontSize: number;
  color: string;
  isDiagonal?: boolean;
}

export interface RedactionObject extends BaseEditorObject {
  type: 'redaction';
  fillColor: string;
}

export interface WhiteoutObject extends BaseEditorObject {
  type: 'whiteout';
  fillColor: string;
}

export type EditorObject = 
  | TextObject 
  | WhiteoutObject
  | ImageObject 
  | ShapeObject 
  | DrawingObject 
  | SignatureObject 
  | WatermarkObject 
  | RedactionObject;

export interface PageDimension {
  width: number;       // display px
  height: number;      // display px
  originalWidth: number;  // unscaled PDF points
  originalHeight: number; // unscaled PDF points
}
