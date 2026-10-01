import io
import math
import base64
import fitz  # PyMuPDF
from typing import List, Dict, Any

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

def get_pymupdf_fontname(family: str, is_bold: bool = False, is_italic: bool = False) -> str:
  """Map web font family and style variants to PyMuPDF standard fonts"""
  fam = (family or "").lower()
  if any(k in fam for k in ("times", "roman", "georgia", "cambria", "serif", "garamond", "palatino")):
    if is_bold and is_italic: return "times-bolditalic"
    if is_bold: return "times-bold"
    if is_italic: return "times-italic"
    return "times-roman"
  elif any(k in fam for k in ("courier", "mono", "code", "consolas", "menlo", "typewriter")):
    if is_bold and is_italic: return "couri-boldoblique"
    if is_bold: return "couri-bold"
    if is_italic: return "couri-oblique"
    return "couri"
  else:
    if is_bold and is_italic: return "helv-boldoblique"
    if is_bold: return "helv-bold"
    if is_italic: return "helv-oblique"
    return "helv"

def process_pdf_operations(pdf_bytes: bytes, operations: List[Dict[str, Any]], page_rotations: Dict[int, int] = None) -> bytes:
  """
  Apply all annotations, text, images, signatures, freehand drawings,
  watermarks, shapes (rect, circle, line, arrow, triangle, star),
  and permanent redactions using PyMuPDF.
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
        if font_size <= 0 or not text:
          continue

        color_rgb = hex_to_rgb(op.get("color", "#000000"))
        font_family = op.get("fontFamily", "")
        is_bold = bool(op.get("isBold", False))
        is_italic = bool(op.get("isItalic", False))
        font_name = get_pymupdf_fontname(font_family, is_bold, is_italic)

        page.insert_textbox(
          rect,
          text,
          fontsize=font_size,
          fontname=font_name,
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

      elif op_type in ("drawing", "highlight"):
        points = op.get("points", [])
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000"))
        stroke_width = max(0.1, float(op.get("strokeWidth", 3)))
        if len(points) >= 2:
          shape = page.new_shape()
          pts = [fitz.Point(float(p["x"]), float(p["y"])) for p in points]
          shape.draw_polyline(pts)
          shape.finish(color=stroke_rgb, width=stroke_width, stroke_opacity=opacity)
          shape.commit()
        elif len(points) == 1:
          shape = page.new_shape()
          shape.draw_circle(fitz.Point(float(points[0]["x"]), float(points[0]["y"])), stroke_width / 2)
          shape.finish(color=stroke_rgb, fill=stroke_rgb, stroke_opacity=opacity, fill_opacity=opacity)
          shape.commit()

      elif op_type == "watermark":
        text = op.get("text", "CONFIDENTIAL")
        font_size = float(op.get("fontSize", 42))
        if font_size <= 0 or not text:
          continue

        color_rgb = hex_to_rgb(op.get("color", "#ef4444"))
        rot_angle = rotation if rotation != 0 else 45
        point = fitz.Point(x, y + height / 2)
        morph = (point, fitz.Matrix(rot_angle))
        font_name = get_pymupdf_fontname(op.get("fontFamily"), is_bold=True)
        page.insert_text(
          point,
          text,
          fontsize=font_size,
          fontname=font_name,
          color=color_rgb,
          fill_opacity=opacity,
          morph=morph
        )

      elif op_type in ("rectangle", "rounded-rect"):
        shape = page.new_shape()
        radius = 8 if op_type == "rounded-rect" else None
        if radius:
          shape.draw_rect(rect, radius=radius)
        else:
          shape.draw_rect(rect)
        stroke_width = float(op.get("strokeWidth", 2))
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000")) if stroke_width > 0 else None
        fill_rgb = hex_to_rgb(op.get("fillColor")) if (op.get("fillColor") and op.get("fillColor") != "transparent") else None
        shape.finish(
          color=stroke_rgb,
          fill=fill_rgb,
          width=max(0.01, stroke_width),
          stroke_opacity=opacity if (stroke_width > 0 and stroke_rgb) else 0.0,
          fill_opacity=opacity if fill_rgb else 0.0
        )
        shape.commit()

      elif op_type == "circle":
        shape = page.new_shape()
        shape.draw_oval(rect)
        stroke_width = float(op.get("strokeWidth", 2))
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000")) if stroke_width > 0 else None
        fill_rgb = hex_to_rgb(op.get("fillColor")) if (op.get("fillColor") and op.get("fillColor") != "transparent") else None
        shape.finish(
          color=stroke_rgb,
          fill=fill_rgb,
          width=max(0.01, stroke_width),
          stroke_opacity=opacity if (stroke_width > 0 and stroke_rgb) else 0.0,
          fill_opacity=opacity if fill_rgb else 0.0
        )
        shape.commit()

      elif op_type == "line":
        shape = page.new_shape()
        p1 = fitz.Point(x, y + height / 2)
        p2 = fitz.Point(x + width, y + height / 2)
        shape.draw_line(p1, p2)
        stroke_width = max(0.1, float(op.get("strokeWidth", 2)))
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000"))
        shape.finish(color=stroke_rgb, width=stroke_width, stroke_opacity=opacity)
        shape.commit()

      elif op_type == "arrow":
        shape = page.new_shape()
        p1 = fitz.Point(x, y + height / 2)
        p2 = fitz.Point(x + width, y + height / 2)
        shape.draw_line(p1, p2)
        stroke_width = max(0.1, float(op.get("strokeWidth", 2)))
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000"))
        
        # Arrowhead coordinates
        arrow_size = min(15.0, width * 0.3)
        pa1 = fitz.Point(p2.x - arrow_size, p2.y - arrow_size * 0.6)
        pa2 = fitz.Point(p2.x - arrow_size, p2.y + arrow_size * 0.6)
        shape.draw_polyline([pa1, p2, pa2])
        shape.finish(color=stroke_rgb, width=stroke_width, stroke_opacity=opacity)
        shape.commit()

      elif op_type == "triangle":
        shape = page.new_shape()
        p_top = fitz.Point(x + width / 2, y)
        p_br = fitz.Point(x + width, y + height)
        p_bl = fitz.Point(x, y + height)
        shape.draw_polyline([p_top, p_br, p_bl, p_top])
        stroke_width = float(op.get("strokeWidth", 2))
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000")) if stroke_width > 0 else None
        fill_rgb = hex_to_rgb(op.get("fillColor")) if (op.get("fillColor") and op.get("fillColor") != "transparent") else None
        shape.finish(
          color=stroke_rgb,
          fill=fill_rgb,
          width=max(0.01, stroke_width),
          stroke_opacity=opacity if (stroke_width > 0 and stroke_rgb) else 0.0,
          fill_opacity=opacity if fill_rgb else 0.0
        )
        shape.commit()

      elif op_type == "star":
        shape = page.new_shape()
        cx = x + width / 2
        cy = y + height / 2
        r_outer = min(width, height) / 2
        r_inner = r_outer * 0.4
        star_pts = []
        for i in range(10):
          r = r_outer if i % 2 == 0 else r_inner
          angle = -math.pi / 2 + i * math.pi / 5
          star_pts.append(fitz.Point(cx + r * math.cos(angle), cy + r * math.sin(angle)))
        star_pts.append(star_pts[0])
        shape.draw_polyline(star_pts)
        stroke_width = float(op.get("strokeWidth", 2))
        stroke_rgb = hex_to_rgb(op.get("strokeColor", "#000000")) if stroke_width > 0 else None
        fill_rgb = hex_to_rgb(op.get("fillColor")) if (op.get("fillColor") and op.get("fillColor") != "transparent") else None
        shape.finish(
          color=stroke_rgb,
          fill=fill_rgb,
          width=max(0.01, stroke_width),
          stroke_opacity=opacity if (stroke_width > 0 and stroke_rgb) else 0.0,
          fill_opacity=opacity if fill_rgb else 0.0
        )
        shape.commit()

      elif op_type in ("redaction", "whiteout"):
        fill_rgb = hex_to_rgb(op.get("fillColor", "#ffffff" if op_type == "whiteout" else "#000000"))
        page.add_redact_annot(rect, fill=fill_rgb)
        page.apply_redactions()

    except Exception as e:
      print(f"Error applying {op_type} to page {page_num}: {e}")

  output_stream = io.BytesIO()
  doc.save(output_stream, garbage=3, deflate=True)
  doc.close()
  return output_stream.getvalue()
