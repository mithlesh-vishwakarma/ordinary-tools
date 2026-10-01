import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from app.services.pdf_service import process_pdf_operations

router = APIRouter(prefix="/pdf", tags=["pdf"])

@router.post("/export")
async def export_pdf(
  file: UploadFile = File(...),
  operations: str = Form("[]"),
  page_rotations: str = Form("{}"),
):
  """
  Receives original PDF and list of JSON operations (text, images, watermarks, redactions),
  applies them via PyMuPDF, and returns the modified PDF stream for download.
  """
  try:
    pdf_bytes = await file.read()
    if not pdf_bytes.startswith(b"%PDF"):
      raise HTTPException(status_code=400, detail="Invalid PDF file uploaded")

    ops_list = json.loads(operations) if operations else []
    rotations_dict = json.loads(page_rotations) if page_rotations else {}

    output_pdf_bytes = process_pdf_operations(pdf_bytes, ops_list, rotations_dict)

    orig_name = file.filename or "document.pdf"
    base_name = orig_name[:-4] if orig_name.lower().endswith(".pdf") else orig_name
    filename = f"{base_name}-ordinary-tools-edited.pdf"
    return Response(
      content=output_pdf_bytes,
      media_type="application/pdf",
      headers={
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Length": str(len(output_pdf_bytes)),
      }
    )
  except HTTPException:
    raise
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")
