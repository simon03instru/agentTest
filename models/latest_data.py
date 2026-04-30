from datetime import datetime
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    String,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from db.db_connect import Base


class StationLatest(Base):
    __tablename__ = "station_latest"

    id_station: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("stations.id_station", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )

    tipe_station: Mapped[str] = mapped_column(String(20), nullable=False)

    last_observed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    status_realtime: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="OFF",
        server_default="OFF",
    )

    interval_detected: Mapped[str | None] = mapped_column(String(20), nullable=True)

    rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    pp_air: Mapped[float | None] = mapped_column(Float, nullable=True)
    rh_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    sr_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    sr_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    wd_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    ws_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    ws_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    tt_air_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    tt_air_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    tt_air_max: Mapped[float | None] = mapped_column(Float, nullable=True)

    # khusus AAWS yang masih relevan untuk latest
    ws_50cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    wl_pan: Mapped[float | None] = mapped_column(Float, nullable=True)
    ev_pan: Mapped[float | None] = mapped_column(Float, nullable=True)
    ws_2m: Mapped[float | None] = mapped_column(Float, nullable=True)

    latest_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    station: Mapped["Station"] = relationship(back_populates="latest")

    __table_args__ = (
        CheckConstraint(
            "tipe_station IN ('aws', 'aaws', 'arg')",
            name="ck_station_latest_tipe_station",
        ),
        CheckConstraint(
            "status_realtime IN ('ON', 'OFF', 'DELAY', 'NO DATA')",
            name="ck_station_latest_status_realtime",
        ),
        Index("idx_station_latest_tipe_station", "tipe_station"),
        Index("idx_station_latest_status_realtime", "status_realtime"),
        Index("idx_station_latest_last_observed_at", "last_observed_at"),
    )