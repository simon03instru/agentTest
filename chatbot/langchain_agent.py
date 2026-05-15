from langchain.agents import create_agent

from chatbot.llm_provider import get_llm
from chatbot.prompt import SYSTEM_PROMPT
from chatbot.langchain_tools import (
    tool_get_summary,
    tool_get_off_stations,
    tool_get_station_detail,
)

tools = [
    tool_get_summary,
    tool_get_off_stations,
    tool_get_station_detail
]

llm = get_llm()

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt=SYSTEM_PROMPT,
)


def run_monitoring_agent(message: str, session_id: str | None = None) -> str:
    result = agent.invoke(
        {
            "messages": [
                {"role": "user", "content": message}
            ]
        }
    )

    messages = result.get("messages", [])
    if not messages:
        return "Maaf, saya belum bisa menjawab pertanyaan tersebut."

    return messages[-1].content