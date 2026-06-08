from fastapi import APIRouter, Depends
from pydantic import BaseModel
from auth.dependencies import require_roles
from chatbot.langchain_agent import run_monitoring_agent
from models.users import User

router = APIRouter(prefix="/chat", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str
    history: list | None = []
    context: dict | None = {}
    provider: str = "gemini"
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str


@router.post("/query", response_model=ChatResponse)
def chat_query(payload: ChatRequest, current_user: User = Depends(require_roles(["admin", "superadmin"])),):
    answer = run_monitoring_agent(
        message=payload.message,
        provider=payload.provider,
        session_id=payload.session_id,
    )

    return ChatResponse(answer=answer)