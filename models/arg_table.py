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


class ObservationARG(Base):
    __tablename__ = "observations_arg"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_station: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("stations.id_station", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    #rr_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)

    #source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    #raw_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    station: Mapped["Station"] = relationship(back_populates="arg_observations")

    __table_args__ = (
        UniqueConstraint("id_station", "observed_at", name="uq_observations_arg_station_time"),
        Index("idx_observations_arg_station_time", "id_station", "observed_at"),
        Index("idx_observations_arg_observed_at", "observed_at"),
    )