from __future__ import annotations

import os
from typing import AsyncGenerator

import anthropic

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_BASE = """You are AgeWell, an AI care assistant supporting professional caregivers at a senior care facility. You help staff understand residents' health trends, draft care notes, and surface patterns across daily logs.

CONSTRAINTS:
- You assist trained care professionals — you do not replace clinical judgment
- Always flag urgent concerns (falls, medication refusals, severe mood drops, chest pain, confusion) for immediate human review
- Never diagnose or prescribe — observe, note patterns, flag for clinical review
- Be concise and clinical; care staff are busy
- Use first names when referring to residents
- If asked about something not in your data, say so clearly
- You are AI and must never claim to be or imply you are a human caregiver"""


async def generate_summary(context: str) -> str:
    response = await client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        thinking={"type": "adaptive"},
        system=[
            {"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": context, "cache_control": {"type": "ephemeral"}},
        ],
        messages=[
            {
                "role": "user",
                "content": "Generate a concise end-of-day care summary for this resident. Include: overall status, any concerns from the last 7 days, active alerts, and a brief recommended follow-up for the next shift. Keep it factual and clinical.",
            }
        ],
    )
    for block in response.content:
        if block.type == "text":
            return block.text
    return ""


async def stream_chat_chunks(
    context: str,
    message: str,
    history: list[dict[str, str]],
) -> AsyncGenerator[str, None]:
    messages = [*history, {"role": "user", "content": message}]

    async with client.messages.stream(
        model="claude-opus-4-7",
        max_tokens=2048,
        thinking={"type": "adaptive"},
        system=[
            {"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": context, "cache_control": {"type": "ephemeral"}},
        ],
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def draft_care_note(context: str, shift_notes: str) -> str:
    response = await client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        thinking={"type": "adaptive"},
        system=[
            {"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": context, "cache_control": {"type": "ephemeral"}},
        ],
        messages=[
            {
                "role": "user",
                "content": f"Draft a professional shift-handover care note based on today's logs and these staff observations:\n\n{shift_notes}\n\nThe note should be factual, clinical, and include any follow-up actions for the next shift.",
            }
        ],
    )
    for block in response.content:
        if block.type == "text":
            return block.text
    return ""
