from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import json
import re
from auth.dependencies import require_roles
from chatbot.langchain_agent import run_monitoring_agent
from models.users import User

router = APIRouter(prefix="/chat", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str
    history: list = Field(default_factory=list)
    context: dict = Field(default_factory=dict)
    provider: str = "gemini"
    model: str | None = None
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    text: str | None = None
    chart: dict | None = None
    chart_svg: str | None = None


def extract_chart_payload(text: str):
    match = re.search(r"\[\[chart\]\]\s*([\s\S]*?)\s*\[\[\/chart\]\]", text)
    if not match:
        return {"text": text.strip(), "chart": None}

    chart_raw = match.group(1).strip()
    try:
        chart = json.loads(chart_raw)
    except json.JSONDecodeError:
        return {"text": text.strip(), "chart": None}

    text_only = re.sub(r"\[\[chart\]\]\s*([\s\S]*?)\s*\[\[\/chart\]\]", "", text).strip()
    return {"text": text_only, "chart": chart}


def escape_xml(text: str) -> str:
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def build_chart_svg(chart: dict) -> str:
    title = escape_xml(chart.get("title", "Chart"))
    summary = escape_xml(chart.get("summary", ""))
    chart_type = chart.get("chart_type", "bar")
    labels = chart.get("labels") or []
    series = chart.get("series") or []
    colors = ["#00d4ff", "#a78bfa", "#22c55e", "#f59e0b", "#ef4444"]
    width, height = 1200, 720
    pad_left, pad_top, pad_right, pad_bottom = 90, 90, 50, 110
    plot_w = width - pad_left - pad_right
    plot_h = height - pad_top - pad_bottom
    values = []
    for s in series:
        values.extend([v for v in (s.get("data") or []) if isinstance(v, (int, float))])
    max_value = max(values) if values else 1

    if chart_type == "line":
        lines = []
        for idx, s in enumerate(series):
            data = s.get("data") or []
            points = []
            for i, value in enumerate(data):
                x = pad_left + (plot_w * i) / max(len(labels) - 1, 1) if labels else pad_left
                y = pad_top + plot_h - ((value or 0) / max_value) * plot_h
                points.append(f"{x},{y}")
            lines.append(
                f'<polyline points="{" ".join(points)}" fill="none" stroke="{colors[idx % len(colors)]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />'
            )

        x_labels = "".join(
            f'<text x="{pad_left + (plot_w * i) / max(len(labels) - 1, 1) if labels else pad_left}" y="{height - 52}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">{escape_xml(label)}</text>'
            for i, label in enumerate(labels)
        )

        return f"""
        <svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
          <rect width="100%" height="100%" fill="#0b1220"/>
          <rect x="18" y="18" width="{width - 36}" height="{height - 36}" rx="28" fill="#0f172a" stroke="rgba(0,212,255,0.18)"/>
          <text x="{pad_left}" y="54" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff">{title}</text>
          <text x="{pad_left}" y="78" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">{summary}</text>
          {x_labels}
          {''.join(lines)}
        </svg>
        """

    bar_width = min(70, plot_w / (len(labels) * 1.5)) if labels else 70
    gap = (plot_w - bar_width * len(labels)) / max(len(labels), 1) if labels else 40
    bars = []
    for i, label in enumerate(labels):
        value = 0
        if series and isinstance(series[0].get("data"), list) and i < len(series[0]["data"]):
            value = series[0]["data"][i] or 0
        h = (value / max_value) * plot_h
        x = pad_left + i * (bar_width + gap)
        y = pad_top + plot_h - h
        bars.append(
            f'<rect x="{x}" y="{y}" width="{bar_width}" height="{h}" rx="10" fill="{colors[0]}"/><text x="{x + bar_width / 2}" y="{height - 52}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">{escape_xml(label)}</text>'
        )

    return f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
      <rect width="100%" height="100%" fill="#0b1220"/>
      <rect x="18" y="18" width="{width - 36}" height="{height - 36}" rx="28" fill="#0f172a" stroke="rgba(0,212,255,0.18)"/>
      <text x="{pad_left}" y="54" font-family="Inter, system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff">{title}</text>
      <text x="{pad_left}" y="78" font-family="IBM Plex Mono, monospace" font-size="16" fill="#94a3b8">{summary}</text>
      {''.join(bars)}
    </svg>
    """


@router.post("/query", response_model=ChatResponse)
async def chat_query(payload: ChatRequest, current_user: User = Depends(require_roles(["admin", "superadmin"]))):
    thread_id = payload.session_id or f"web-user-{current_user.id}"

    answer = await run_monitoring_agent(
        message=payload.message,
        provider=payload.provider,
        model=payload.model,
        session_id=thread_id,
    )

    structured = extract_chart_payload(answer)
    chart_svg = build_chart_svg(structured["chart"]) if structured.get("chart") else None
    return ChatResponse(
        answer=json.dumps(structured, ensure_ascii=False),
        text=structured.get("text"),
        chart=structured.get("chart"),
        chart_svg=chart_svg,
    )
