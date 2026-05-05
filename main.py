from fastapi import FastAPI, Depends, HTTPException
from db.db_connect import get_db
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from chatbot.chatbot_route import router as ai_router
import uvicorn

from schemas.schemas import (
    RealtimeMapResponse,
    RealtimeStationResponse,
    RealtimeSummaryItem,
    RealtimeSummaryResponse,
)
from services.query_logic import (
    get_realtime_map_status,
    get_all_realtime_status,
    get_realtime_off_status,
    get_realtime_summary,
    get_station_realtime_detail,
)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3009",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(ai_router)


@app.get("/")
def home():
    return {"message": "rumah"}


@app.get("/map", response_model=list[RealtimeMapResponse])
def realtime_map(
    tipe_station: str | None = None,
    status_realtime: str | None = None,
    db: Session = Depends(get_db),
):
    rows = get_realtime_map_status(
        db=db,
        tipe_station=tipe_station,
        status_realtime=status_realtime,
    )
    return rows


@app.get("/status", response_model=list[RealtimeStationResponse])
def realtime_status(
    tipe_station: str | None = None,
    status_realtime: str | None = None,
    db: Session = Depends(get_db),
):
    rows = get_all_realtime_status(
        db=db,
        tipe_station=tipe_station,
        status_realtime=status_realtime,
    )
    return rows


@app.get("/off", response_model=list[RealtimeStationResponse])
def realtime_off(
    tipe_station: str | None = None,
    db: Session = Depends(get_db),
):
    rows = get_realtime_off_status(db=db, tipe_station=tipe_station)
    return rows


@app.get("/summary", response_model=RealtimeSummaryResponse)
def realtime_summary(db: Session = Depends(get_db)):
    rows = get_realtime_summary(db)

    items = [
        RealtimeSummaryItem(
            tipe_station=row.tipe_station,
            status_realtime=row.status_realtime,
            total=row.total,
        )
        for row in rows
    ]

    return RealtimeSummaryResponse(items=items)


@app.get("/station/{id_station}", response_model=RealtimeStationResponse)
def realtime_station_detail(
    id_station: str,
    db: Session = Depends(get_db),
):
    row = get_station_realtime_detail(db, id_station)

    if not row:
        raise HTTPException(status_code=404, detail="Station tidak ditemukan")

    return row

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8009)
