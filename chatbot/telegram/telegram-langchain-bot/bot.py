import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT_DIR))

import os
import logging

from dotenv import load_dotenv

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.messages import HumanMessage
from langchain_core.messages.utils import (
    trim_messages,
    count_tokens_approximately  
)
from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, START, MessagesState
from llm_provider import get_llm
from prompt import SYSTEM_PROMPT
from langchain_core.messages.utils import trim_messages

load_dotenv()

# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)

# ============================================================
# Global Agent
# ============================================================

memory = InMemorySaver()

agent = None

# ============================================================
# Get Previous Conv --> Short Memory
# ============================================================
def pre_model_hook(state):

    trimmed = trim_messages(
        state["messages"],
        strategy="last",
        token_counter=count_tokens_approximately,
        max_tokens=3000,
        start_on="human",
        end_on=("human", "tool"),
    )

    return {
        "messages": trimmed
    }

# ============================================================
# MCP Tools
# ============================================================

async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            "monitoring": {
                "command": "python",
                "args": [
                    "/home/station/chatbot/mcp_tools.py"
                ],
                "transport": "stdio",
            }
        }
    )

    return await client.get_tools()


# ============================================================
# Agent Builder
# ============================================================

async def build_agent():

    llm = get_llm("openai")

    tools = await get_mcp_tools()

    return create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        checkpointer = memory,
    )


# ============================================================
# Startup Hook
# ============================================================

async def post_init(application: Application):

    global agent

    logger.info("Loading MCP tools and agent...")

    agent = await build_agent()

    logger.info("Agent successfully initialized.")


# ============================================================
# Telegram Commands
# ============================================================

async def start(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    user = update.effective_user

    await update.message.reply_text(
        f"Hi {user.first_name}! "
        f"Aku AREK (Agent Reporter pEralatan Klimatologi).\n\n"
        f"Tanya aku mengenai performa, kondisi, dan status "
        f"peralatan klimatologi BMKG."
    )


async def help_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    await update.message.reply_text(
        "Contoh pertanyaan:\n\n"
        "- Bagaimana kondisi AWS saat ini?\n"
        "- Stasiun mana yang sedang offline?\n"
        "- Detail kondisi AWS Dieng\n"
        "- Ringkasan monitoring peralatan hari ini"
    )


# ============================================================
# Message Handler
# ============================================================

async def handle_message(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:
    global agent

    if agent is None:
        await update.message.reply_text(
            "Agent masih melakukan inisialisasi. Silakan coba lagi beberapa saat."
        )
        return

    user_message = update.message.text
    chat_id = str(update.effective_chat.id)
    config = {"configurable": {"thread_id": chat_id}}

    try:
        # 1. Get existing conversation history from checkpointer
        state = agent.get_state(config)
        existing_messages = state.values.get("messages", []) if state.values else []

        # 2. Append the new user message
        from langchain_core.messages import HumanMessage
        all_messages = existing_messages + [HumanMessage(content=user_message)]

        # 3. Trim to last ~3000 tokens
        trimmed_messages = trim_messages(
            all_messages,
            strategy="last",
            token_counter=count_tokens_approximately,
            max_tokens=300,
            start_on="human",
            end_on=("human", "tool"),
        )

        # 4. Invoke agent with the trimmed history
        result = await agent.ainvoke(
            {"messages": trimmed_messages},
            config=config,
        )

        response = result["messages"][-1].content

        if isinstance(response, list):
            response = str(response)

        await update.message.reply_text(response)

    except Exception as e:
        logger.exception("Agent execution error")
        await update.message.reply_text(
            "Maaf, terjadi kesalahan saat memproses permintaan Anda."
        )


# ============================================================
# Error Handler
# ============================================================

async def error_handler(
    update: object,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    logger.error(
        "Exception while handling an update:",
        exc_info=context.error,
    )


# ============================================================
# Main
# ============================================================

def main():

    token = os.getenv("TELEGRAM_BOT_TOKEN")

    if not token:
        raise ValueError(
            "TELEGRAM_BOT_TOKEN tidak ditemukan di environment variable."
        )

    app = (
        Application.builder()
        .token(token)
        .post_init(post_init)
        .build()
    )

    app.add_handler(
        CommandHandler("start", start)
    )

    app.add_handler(
        CommandHandler("help", help_command)
    )

    app.add_handler(
        MessageHandler(
            filters.TEXT & ~filters.COMMAND,
            handle_message,
        )
    )

    app.add_error_handler(
        error_handler
    )

    logger.info("Starting Telegram bot...")

    app.run_polling()


if __name__ == "__main__":
    main()