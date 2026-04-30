from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RealtimeMapResponse(BaseModel):
    id_station: str
    tipe_station: str
    name_station: str
    nama_kota: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    elevasi: float | None = None

    status_realtime: str
    last_observed_at: datetime | None = None
    last_ingested_at: datetime | None = None
    interval_detected: str | None = None


class RealtimeStationResponse(BaseModel):
    id_station: str
    tipe_station: str
    name_station: str
    nama_kota: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    elevasi: float | None = None

    last_observed_at: datetime | None = None
    last_ingested_at: datetime | None = None
    status_realtime: str
    interval_detected: str | None = None

    rr: float | None = None
    pp_air: float | None = None
    rh_avg: float | None = None
    sr_avg: float | None = None
    sr_max: float | None = None
    wd_avg: float | None = None
    ws_avg: float | None = None
    ws_max: float | None = None
    tt_air_avg: float | None = None
    tt_air_min: float | None = None
    tt_air_max: float | None = None

    ws_50cm: float | None = None
    wl_pan: float | None = None
    ev_pan: float | None = None
    ws_2m: float | None = None

    model_config = ConfigDict(from_attributes=True)


class RealtimeSummaryItem(BaseModel):
    tipe_station: str
    status_realtime: str
    total: int


class RealtimeSummaryResponse(BaseModel):
    items: list[RealtimeSummaryItem]