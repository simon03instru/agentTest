import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from dotenv import load_dotenv

load_dotenv()

SUPPORTED_MODELS = {
    "gemini": {
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
    },
    "openai": {
        "gpt-5.4-mini",
        "gpt-5.4-nano",
        "gpt-4.1-mini",
    },
}


def get_default_model(provider: str = "gemini") -> str:
    provider = provider.lower()
    if provider == "gemini":
        return os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    if provider == "openai":
        return os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
    raise ValueError(f"LLM_PROVIDER belum didukung: {provider}")


def get_llm(provider: str = "gemini", model: str | None = None):
    provider = provider.lower()
    model_name = model or get_default_model(provider)

    if provider not in SUPPORTED_MODELS:
        raise ValueError(f"LLM_PROVIDER belum didukung: {provider}")

    if model_name not in SUPPORTED_MODELS[provider]:
        raise ValueError(f"Model tidak didukung untuk {provider}: {model_name}")

    if provider == "gemini":
        print(f"[LLM] Gemini model: {model_name}")
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )


    elif provider == "openai":
        print(f"[LLM] Openai model: {model_name}")
        return ChatOpenAI(
            model=model_name,
            temperature=0,
            api_key=os.getenv("OPENAI_API_KEY"),
        )
