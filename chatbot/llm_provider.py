import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from dotenv import load_dotenv

load_dotenv()

def get_llm(provider: str = "gemini"):
    provider = provider.lower()

    if provider == "gemini":
        print(f"[LLM] Gemini model: {'gemini'}")
        return ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
            temperature=0,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )


    elif provider == "openai":
        print(f"[LLM] Openai model: {'gpt'}")
        return ChatOpenAI(
            model=os.getenv(
                "OPENAI_MODEL",
                "gpt-4.1-mini",
            ),
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY"),
        )

    raise ValueError(
        f"LLM_PROVIDER belum didukung: {provider}"
    )