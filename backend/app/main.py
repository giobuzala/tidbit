"""FastAPI entrypoint for the ChatKit starter backend."""

from __future__ import annotations

from chatkit.server import StreamingResult
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from chatkit.types import FileAttachment

from .server import StarterChatServer

app = FastAPI(title="ChatKit Starter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatkit_server = StarterChatServer()

SESSION_HEADER = "x-tidbit-session"


def _request_context(request: Request) -> dict:
    return {"request": request, "session_id": request.headers.get(SESSION_HEADER)}


@app.post("/chatkit")
async def chatkit_endpoint(request: Request) -> Response:
    """Proxy the ChatKit web component payload to the server implementation."""
    payload = await request.body()
    result = await chatkit_server.process(payload, _request_context(request))

    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    if hasattr(result, "json"):
        return Response(content=result.json, media_type="application/json")
    return JSONResponse(result)


@app.post("/files")
async def upload_file(request: Request, file: UploadFile = File(...)) -> Response:
    """Direct upload endpoint for PDF/Word attachments."""
    filename = file.filename or "document.pdf"
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }
    allowed_extensions = (".pdf", ".docx", ".doc")
    if (
        file.content_type not in allowed_types
        and not filename.lower().endswith(allowed_extensions)
    ):
        raise HTTPException(
            status_code=400, detail="Only PDF or Word uploads are supported."
        )

    content = await file.read()
    attachment_id = f"att_{uuid4().hex}"
    attachment = FileAttachment(
        id=attachment_id,
        name=filename,
        mime_type=file.content_type or "application/octet-stream",
    )

    await chatkit_server.store.save_attachment_bytes(attachment_id, content)
    await chatkit_server.store.save_attachment(
        attachment, context=_request_context(request)
    )

    return Response(content=attachment.model_dump_json(), media_type="application/json")
