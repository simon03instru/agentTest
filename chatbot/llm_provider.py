import os
from langchain_google_genai import ChatGoogleGenerativeAI


def get_llm():
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()

    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
            temperature=0,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )

    raise ValueError(f"LLM_PROVIDER belum didukung: {provider}")