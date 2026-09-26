import io
import fitz  # PyMuPDF
from typing import List, Dict, Any
import base64

def hex_to_rgb(hex_str: str):
  """Convert hex color (#RRGGBB) to tuple of floats (0.0 to 1.0)"""
  if not hex_str or not hex_str.startswith("#"):
    return (0.0, 0.0, 0.0)
  hex_clean = hex_str.lstrip("#")
  if len(hex_clean) == 3:
    hex_clean = "".join([c * 2 for c in hex_clean])
  if len(hex_clean) != 6:
    return (0.0, 0.0, 0.0)
  try:
    r = int(hex_clean[0:2], 16) / 255.0
    g = int(hex_clean[2:4], 16) / 255.0
    b = int(hex_clean[4:6], 16) / 255.0
    return (r, g, b)
  except Exception:
    return (0.0, 0.0, 0.0)

def process_pdf_operations(pdf_bytes: bytes, operations: List[Dict[str, Any]], page_rotations: Dict[int, int] = None) -> bytes:
  """
  Apply all annotations, text, images, watermarks, shapes, and redactions
  using PyMuPDF to produce the final PDF document.
  """
  doc = fitz.open(stream=pdf_bytes, filetype="pdf")
  total_pages = len(doc)

  # Apply page-level rotations if provided
  if page_rotations:
    for page_str, deg in page_rotations.items():
      try:
        p_num = int(page_str)
        if 1 <= p_num <= total_pages:
          page = doc[p_num - 1]
          current_rot = page.rotation
          page.set_rotation((current_rot + deg) % 360)
      except Exception:
        continue

  # Apply objects to corresponding pages
  for op in operations:
    page_num = op.get("page", 1)
    if page_num < 1 or page_num > total_pages:
      continue

    page = doc[page_num - 1]
    op_type = op.get("type")
    x = float(op.get("x", 0))
    y = float(op.get("y", 0))
    width = float(op.get("width", 100))
    height = float(op.get("height", 30))
    rotation = int(op.get("rotation", 0)) % 360
    opacity = float(op.get("opacity", 1.0))
    rect = fitz.Rect(x, y, x + width, y + height)

    try:
      if op_type == "text":
        text = op.get("text", "")
        font_size = float(op.get("fontSize", 16))
        color_rgb = hex_to_rgb(op.get("color", "#000000"))
        
        # Insert text with rotation support
        page.insert_textbox(
          rect,
          text,
          fontsize=font_size,
          color=color_rgb,
          rotate=rotation,
          align=fitz.TEXT_ALIGN_LEFT if op.get("textAlign") != "center" else fitz.TEXT_ALIGN_CENTER
        )

      elif op_type in ("image", "signature"):
        src = op.get("src") or op.get("signatureDataUrl")
        if src and "base64," in src:
          header, base64_data = src.split("base64,", 1)
          image_bytes = base64.b64decode(base64_data)
          page.insert_image(rect, stream=image_bytes, rotate=rotation)

      elif op_type == "watermark":
        text = op.get("text", "CONFIDENTIAL")
        font_size = float(op.get("fontSize", 42))
        color_rgb = hex_to_rgb(op.get("color", "#ff0000"))
        point = fitz.Point(x + width / 4, y + height / 2)
        page.insert_text(
          point,
          text,
          fontsize=font_size,
          color=color_rgb,
          rotate=rotation if rotation != 0 else 45,
          fill_opacity=opacity
        )

      elif op_type == "rectangle":
        shape = page.new_shape()
        shape.draw_rect(rect)
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000"))
        stroke_width = float(op.get("strokeWidth", 2))
        fill_rgb = hex_to_rgb(op.get("fillColor")) if op.get("fillColor") else None
        shape.finish(color=stroke_rgb, fill=fill_rgb, width=stroke_width, fill_opacity=opacity)
        shape.commit()

      elif op_type == "circle":
        shape = page.new_shape()
        center = fitz.Point(x + width / 2, y + height / 2)
        radius = min(width, height) / 2
        shape.draw_circle(center, radius)
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000"))
        stroke_width = float(op.get("strokeWidth", 2))
        fill_rgb = hex_to_rgb(op.get("fillColor")) if op.get("fillColor") else None
        shape.finish(color=stroke_rgb, fill=fill_rgb, width=stroke_width, fill_opacity=opacity)
        shape.commit()

      elif op_type == "redaction":
        fill_rgb = hex_to_rgb(op.get("fillColor", "#000000"))
        page.add_redact_annot(rect, fill=fill_rgb)
        page.apply_redactions()

    except Exception as e:
      # Log individual object error and continue processing
      print(f"Error applying {op_type} to page {page_num}: {e}")

  output_stream = io.BytesIO()
  doc.save(output_stream, garbage=3, deflate=True)
  doc.close()
  return output_stream.getvalue()
