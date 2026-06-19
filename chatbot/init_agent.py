import asyncio

from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient

from llm_provider import get_llm
from prompt import SYSTEM_PROMPT


async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            "monitoring": {
                "command": "python",
                "args": ["/home/station/chatbot/mcp_tools.py"],
                "transport": "stdio",
            }
        }
    )

    return await client.get_tools()


async def build_agent(provider: str = "gemini", model: str | None = None):
    llm = get_llm(provider, model=model)

    tools = await get_mcp_tools()

    return create_agent(
        model=llm,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
    )


async def run_monitoring_agent(
    message: str,
    provider: str = "gemini",
    model: str | None = None,
    session_id: str | None = None,
) -> str:
    agent = await build_agent(provider, model=model)

    result = await agent.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": message,
                }
            ]
        }
    )

    return result["messages"][-1].content


# async def main():
#     response = await run_monitoring_agent(
#         "What tools do you have available?"
#     )

#     print("\n=== AGENT RESPONSE ===")
#     print(response)


# if __name__ == "__main__":
#     asyncio.run(main())
