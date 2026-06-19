from pathlib import Path

from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_core.messages.utils import count_tokens_approximately, trim_messages
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.checkpoint.memory import InMemorySaver

from chatbot.llm_provider import get_llm
from chatbot.prompt import SYSTEM_PROMPT

memory = InMemorySaver()
agents = {}


async def get_mcp_tools():
    mcp_script = Path(__file__).resolve().parent / "mcp_tools.py"
    client = MultiServerMCPClient(
        {
            "monitoring": {
                "command": "python",
                "args": [str(mcp_script)],
                "transport": "stdio",
            }
        }
    )

    return await client.get_tools()


async def build_agent(provider: str = "gemini"):
    llm = get_llm(provider)
    tools = await get_mcp_tools()

    return create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        checkpointer=memory,
    )


async def get_agent(provider: str = "gemini"):
    provider_key = provider.lower()

    if provider_key not in agents:
        agents[provider_key] = await build_agent(provider_key)

    return agents[provider_key]


async def run_monitoring_agent(
    message: str,
    provider: str = "gemini",
    session_id: str | None = None,
) -> str:
    agent = await get_agent(provider)
    thread_id = session_id or "web-chat"
    config = {"configurable": {"thread_id": thread_id}}

    state = agent.get_state(config)
    existing_messages = state.values.get("messages", []) if state.values else []

    all_messages = existing_messages + [HumanMessage(content=message)]
    trimmed_messages = trim_messages(
        all_messages,
        strategy="last",
        token_counter=count_tokens_approximately,
        max_tokens=100,
        start_on="human",
        end_on=("human", "tool"),
    )

    result = await agent.ainvoke(
        {"messages": trimmed_messages},
        config=config,
    )

    response = result["messages"][-1].content

    if isinstance(response, list):
        return str(response)

    return response
