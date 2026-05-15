from fastapi import APIRouter
from pydantic import BaseModel

from chatbot.langchain_agent import run_monitoring_agent

router = APIRouter(prefix="/chat", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str


@router.post("/query", response_model=ChatResponse)
def chat_query(payload: ChatRequest):
    answer = run_monitoring_agent(
        message=payload.message,
        session_id=payload.session_id,
    )

    return ChatResponse(answer=answer)