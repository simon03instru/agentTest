from datetime import datetime
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    String,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from db.db_connect import Base

from models.arg_table import ObservationARG
from models.aaws_table import ObservationAAWS
from models.aws_table import ObservationAWS


class Station(Base):
    __tablename__ = "stations"

    id_station: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    tipe_station: Mapped[str] = mapped_column(String(20), nullable=False)
    name_station: Mapped[str] = mapped_column(String(255), nullable=False)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    elevasi: Mapped[float | None] = mapped_column(Float, nullable=True)

    nama_kota: Mapped[str | None] = mapped_column(String(150), nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    arg_observations: Mapped[list["ObservationARG"]] = relationship(
        back_populates="station",
        cascade="all, delete-orphan",
    )
    aws_observations: Mapped[list["ObservationAWS"]] = relationship(
        back_populates="station",
        cascade="all, delete-orphan",
    )
    aaws_observations: Mapped[list["ObservationAAWS"]] = relationship(
        back_populates="station",
        cascade="all, delete-orphan",
    )
    latest: Mapped["StationLatest | None"] = relationship(
        back_populates="station",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "tipe_station IN ('aws', 'aaws', 'arg')",
            name="ck_stations_tipe_station",
        ),
        Index("idx_stations_tipe_station", "tipe_station"),
        Index("idx_stations_nama_kota", "nama_kota"),
    )