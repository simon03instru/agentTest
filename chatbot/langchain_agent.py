from langchain.agents import create_agent

from chatbot.llm_provider import get_llm
from chatbot.prompt import SYSTEM_PROMPT
from chatbot.langchain_tools import (
    tool_get_summary,
    tool_get_off_stations,
    tool_get_station_detail,
    tool_get_percentage_id_station,
)

tools = [
    tool_get_summary,
    tool_get_off_stations,
    tool_get_station_detail,
    tool_get_percentage_id_station
]

def build_agent(provider: str = "gemini"):
    llm = get_llm(provider)

    return create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
    )

def run_monitoring_agent(
    message: str,
    provider: str = "gemini",
    session_id: str | None = None,
) -> str:
    agent = build_agent(provider)

    result = agent.invoke({
        "messages": [
            {"role": "user", "content": message}
        ]
    })

    return result["messages"][-1].content