from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from core.cache import get_cache, set_cache
from core.limit import limiter

# Sesuaikan dengan letak fungsi get_db dan rate limiter kamu
from db.db_connect import get_db
from services.query_logic import (
    get_filtered_stations,
    get_dropdown_options,
    export_daily_data_excel,
)

router = APIRouter(prefix="/station", tags=["Station & Export"])


@router.get("/filter")
@limiter.limit("30/minute")
def filter_stations_endpoint(
    request: Request,
    balai: Optional[str] = Query(None),
    provinsi: Optional[str] = Query(None),
    upt: Optional[str] = Query(None),
    kota: Optional[str] = Query(None),
    tipe_station: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    cache_key = (
        f"station:filter:"
        f"{balai or 'ALL'}:"
        f"{provinsi or 'ALL'}:"
        f"{upt or 'ALL'}:"
        f"{kota or 'ALL'}:"
        f"{tipe_station or 'ALL'}"
    )

    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    raw_rows = get_filtered_stations(
        db=db,
        balai=balai,
        provinsi=provinsi,
        upt=upt,
        kota=kota,
        tipe_station=tipe_station,
    )

    if not raw_rows:
        raise HTTPException(status_code=404, detail="Data stasiun tidak ditemukan.")

    rows = [dict(row._mapping) for row in raw_rows]

    # Simpan selama 30-60 detik agar status realtime alat di peta tetap up-to-date
    set_cache(
        cache_key,
        rows,
        ttl=60,
    )
    return rows


@router.get("/filter-options")
@limiter.limit("60/minute")
def filter_options_endpoint(
    request: Request,
    balai: Optional[str] = Query(None),
    provinsi: Optional[str] = Query(None),
    upt: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    cache_key = (
        f"station:filter_options:"
        f"{balai or 'ALL'}:"
        f"{provinsi or 'ALL'}:"
        f"{upt or 'ALL'}:"
        #f"{kota or 'ALL'}"
    )

    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    data = get_dropdown_options(
        db=db,
        balai=balai,
        provinsi=provinsi,
        upt=upt,
        #kota=kota,
    )

    # Master data lokasi jarang berubah, simpan di cache lebih lama (1 jam / 3600 detik)
    set_cache(
        cache_key,
        data,
        ttl=3600,
    )
    return data


@router.get("/export/excel")
@limiter.limit("5/minute")
def export_excel_endpoint(
    request: Request,
    tanggal: date = Query(..., description="Format: YYYY-MM-DD"),
    balai: Optional[str] = Query(None),
    provinsi: Optional[str] = Query(None),
    upt: Optional[str] = Query(None),
    kota: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    excel_stream = export_daily_data_excel(
        db, tanggal=tanggal, balai=balai, provinsi=provinsi, upt=upt, kota=kota
    )
    if excel_stream is None:
        raise HTTPException(status_code=404, detail="Tidak ada stasiun yang cocok dengan filter yang dipilih.")

    area_label = balai or provinsi or upt or kota or "Nasional"
    area_label = area_label.replace(" ", "_").replace("/", "_")
    filename = f"Export_Observasi_{area_label}_{tanggal}.xlsx"

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )