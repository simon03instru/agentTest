from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from schemas.schemas import ChatRequest
from chatbot.openclaw_client import stream_openclaw_chat

router = APIRouter(prefix="/ai", tags=["AI Analyst"])


@router.post("/chat/stream")
async def ai_chat_stream(payload: ChatRequest):
    prompt = f"""
Kamu adalah AI Analyst monitoring stasiun BMKG.

Gunakan plugin/tools monitoring yang tersedia jika user bertanya tentang:
- summary jumlah stasiun
- status ON/OFF/DELAY/NO DATA
- ARG, AWS, AAWS
- daftar stasiun OFF
- data terbaru/latest stasiun
- detail satu stasiun

Tools yang tersedia:
- monitoring_summary
- monitoring_status
- monitoring_off
- monitoring_latest

Aturan:
- Jangan mengarang angka.
- Untuk pertanyaan monitoring, wajib gunakan tool/plugin.
- Jawab berdasarkan JSON dari tool.
- Jawab dalam Bahasa Indonesia yang ringkas dan operasional.

KONTEKS DASHBOARD FRONTEND:
{payload.context}

SYSTEM PROMPT FRONTEND:
{payload.systemPrompt or ""}

PERTANYAAN USER:
{payload.message}
"""

    return StreamingResponse(
        stream_openclaw_chat(prompt, payload.session_key),
        media_type="text/plain",
    )