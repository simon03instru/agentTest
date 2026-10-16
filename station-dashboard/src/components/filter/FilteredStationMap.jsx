/**
 * Peta Leaflet untuk hasil /station/filter.
 * - Pusat awal Indonesia [-2.5, 118], zoom 5
 * - fitBounds otomatis saat kumpulan stasiun berubah
 * - Warna marker mengikuti status_realtime (ON hijau, DELAY oranye, OFF merah, kosong abu-abu)
 */
import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { getStatusColor } from '@/utils/helpers'
import {
  createStationIcon, buildStationPopupHtml, normalizeFilteredStation, hasCoords,
} from '@/utils/mapMarkers'

const CENTER = [-2.5, 118.0]
const ZOOM = 5

function MarkerLayer({ stations }) {
  const map = useMap()
  const navigate = useNavigate()

  useEffect(() => {
    const markers = []

    stations.forEach((raw) => {
      const s = normalizeFilteredStation(raw)
      if (!hasCoords(s)) return

      const color  = getStatusColor(s.status)
      const marker = L.marker([s.lat, s.lon], {
        icon: createStationIcon(s.tipe, color),
        title: s.name,                       // tooltip native saat hover
      })

      marker.bindPopup(
        L.popup({ className: 'station-popup', maxWidth: 260 })
          .setContent(buildStationPopupHtml(s, color))
      )

      marker.on('popupopen', (e) => {
        const btn = e.popup.getElement()?.querySelector('[data-action="detail"]')
        if (btn) {
          btn.onclick = () => {
            marker.closePopup()
            navigate(`/station/${encodeURIComponent(s.id)}`)
          }
        }
      })

      marker.addTo(map)
      markers.push(marker)
    })

    return () => markers.forEach((m) => m.remove())
  }, [stations, map, navigate])

  return null
}

/** fitBounds hanya jika daftar stasiun benar-benar berubah (bukan sekadar refetch yang sama). */
function FitBounds({ stations }) {
  const map = useMap()
  const key = useMemo(() => stations.map((s) => s.id_station).join('|'), [stations])

  useEffect(() => {
    const points = stations
      .map(normalizeFilteredStation)
      .filter(hasCoords)
      .map((s) => [s.lat, s.lon])

    if (points.length === 0) {
      map.setView(CENTER, ZOOM)
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 11 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])

  return null
}

/** Sidebar dibuka/ditutup → ukuran container berubah → Leaflet harus dihitung ulang. */
function ResizeWatcher() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}

export default function FilteredStationMap({ stations }) {
  return (
    <MapContainer
      center={CENTER}
      zoom={ZOOM}
      className="h-full w-full"
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <MarkerLayer stations={stations} />
      <FitBounds stations={stations} />
      <ResizeWatcher />
    </MapContainer>
  )
}
