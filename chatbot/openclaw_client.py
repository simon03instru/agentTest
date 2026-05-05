import os
import json
import uuid
import websockets
from dotenv import load_dotenv

load_dotenv()

OPENCLAW_WS_URL = os.getenv("OPENCLAW_WS_URL")
OPENCLAW_AUTH_TOKEN = os.getenv("OPENCLAW_AUTH_TOKEN",)


async def stream_openclaw_chat(prompt: str, session_key: str):
    async with websockets.connect(OPENCLAW_WS_URL) as ws:
        connect_id = str(uuid.uuid4())

        connect_frame = {
            "type": "req",
            "id": "connect-1",
            "method": "connect",
            "params": {
                "minProtocol": 3,
                "maxProtocol": 3,
                "client": {
                    "id": "webchat",
                    "displayName": "BMKG FastAPI",
                    "version": "1.0.0",
                    "platform": "web",
                    "mode": "webchat"
                },
                "role": "operator",
                "scopes": [
                    "operator.read",
                    "operator.write"
                ],
                "caps": [],
                "locale": "id-ID",
                "userAgent": "BMKG-FastAPI/1.0"
            }
        }

        await ws.send(json.dumps(connect_frame))

        while True:
            raw = await ws.recv()
            event = json.loads(raw)
            print("CONNECT EVENT:", event)

            if event.get("type") == "res" and event.get("id") == connect_id:
                if not event.get("ok"):
                    yield f"OpenClaw connect error: {event.get('error')}"
                    return
                break

        chat_id = str(uuid.uuid4())

        chat_frame = {
            "type": "req",
            "id": chat_id,
            "method": "chat.send",
            "params": {
                "sessionKey": session_key,
                "text": prompt,
                "idempotencyKey": str(uuid.uuid4())
            }
        }

        await ws.send(json.dumps(chat_frame))

        while True:
            raw = await ws.recv()
            event = json.loads(raw)
            print("OPENCLAW EVENT:", event)

            if event.get("type") == "res" and event.get("id") == chat_id:
                if event.get("ok") is False:
                    yield f"OpenClaw chat.send error: {event.get('error')}"
                    return

            if event.get("type") == "event":
                payload = event.get("payload", {})

                text = (
                    payload.get("text")
                    or payload.get("delta")
                    or payload.get("content")
                    or payload.get("message")
                    or ""
                )

                if text:
                    yield text

                status = payload.get("status") or payload.get("state")
                if status in ["done", "completed", "complete", "error"]:
                    break