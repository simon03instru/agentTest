from datetime import datetime
from sqlalchemy import (
    BigInteger,
    DateTime,
    Float,
    ForeignKey,
    String,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from db.db_connect import Base


class ObservationAAWS(Base):
    __tablename__ = "observations_aaws"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    id_station: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("stations.id_station", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )

    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    #rr_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    pp_air: Mapped[float | None] = mapped_column(Float, nullable=True)
    #pp_air_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    rh_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    #rh_avg_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    sr_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    #sr_avg_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    sr_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    #sr_max_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    wd_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    #wd_avg_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    ws_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    #ws_avg_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    ws_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    #ws_max_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    tt_air_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    #tt_air_avg_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    tt_air_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    #tt_air_min_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    tt_air_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    #tt_air_max_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    ws_50cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    #ws_50cm_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    wl_pan: Mapped[float | None] = mapped_column(Float, nullable=True)
    #wl_pan_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    ev_pan: Mapped[float | None] = mapped_column(Float, nullable=True)
    #ev_pan_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    ws_2m: Mapped[float | None] = mapped_column(Float, nullable=True)
    #ws_2m_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    #raw_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    station: Mapped["Station"] = relationship(back_populates="aaws_observations")

    __table_args__ = (
        UniqueConstraint("id_station", "observed_at", name="uq_observations_aaws_station_time"),
        Index("idx_observations_aaws_station_time", "id_station", "observed_at"),
        Index("idx_observations_aaws_observed_at", "observed_at"),
    )