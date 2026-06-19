from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from auth.dependencies import require_roles
from chatbot.langchain_agent import run_monitoring_agent
from models.users import User

router = APIRouter(prefix="/chat", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str
    history: list = Field(default_factory=list)
    context: dict = Field(default_factory=dict)
    provider: str = "gemini"
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str


@router.post("/query", response_model=ChatResponse)
async def chat_query(payload: ChatRequest, current_user: User = Depends(require_roles(["admin", "superadmin"]))):
    thread_id = payload.session_id or f"web-user-{current_user.id}"

    answer = await run_monitoring_agent(
        message=payload.message,
        provider=payload.provider,
        session_id=thread_id,
    )

    return ChatResponse(answer=answer)
