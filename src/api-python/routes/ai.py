from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ai.agent import draft_care_note, generate_summary, stream_chat_chunks
from ai.context import build_resident_context
from models import CareNoteRequest, ChatRequest

router = APIRouter()


@router.post("/summary/{resident_id}")
async def summary(resident_id: int) -> dict:
    context = await asyncio.to_thread(build_resident_context, resident_id)
    text = await generate_summary(context)
    return {"summary": text}


@router.post("/chat/{resident_id}")
async def chat(resident_id: int, body: ChatRequest) -> StreamingResponse:
    context = await asyncio.to_thread(build_resident_context, resident_id)

    async def generate():
        try:
            async for text in stream_chat_chunks(context, body.message, body.history):
                yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.post("/care-note/{resident_id}")
async def care_note(resident_id: int, body: CareNoteRequest) -> dict:
    context = await asyncio.to_thread(build_resident_context, resident_id)
    note = await draft_care_note(context, body.shiftNotes)
    return {"note": note}
