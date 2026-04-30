# Station Monitoring Dashboard

Dashboard monitoring realtime jaringan stasiun pengamatan, dibangun dengan React + Vite.

## Stack

| Library | Versi | Alasan |
|---|---|---|
| **React** | 18 | Library UI utama |
| **Vite** | 5 | Build tool cepat, HMR, proxy dev |
| **React Router** | 6 | Client-side routing |
| **Axios** | 1.x | HTTP client dengan interceptor |
| **TanStack Query** | 5 | Fetching, caching, auto-refresh |
| **React Leaflet** | 4 | Komponen map berbasis Leaflet |
| **Tailwind CSS** | 3 | Utility-first styling |
| **date-fns** | 3 | Format tanggal/waktu |
| **clsx** | 2 | Class conditional utility |

## Struktur Folder

```
src/
├── api/
│   ├── client.js          # Axios instance + interceptor
│   └── stations.js        # Semua fungsi API call
├── components/
│   ├── cards/
│   │   └── SummaryCards.jsx   # KPI cards + breakdown per tipe
│   ├── layout/
│   │   └── Layout.jsx         # Topbar + Outlet wrapper
│   ├── map/
│   │   └── StationMap.jsx     # Peta Leaflet semua site
│   ├── table/
│   │   └── OffStationsTable.jsx # Tabel site bermasalah
│   └── ui/
│       └── RefreshIndicator.jsx # Tombol refresh manual
├── constants/
│   ├── api.js             # BASE_URL, interval, status config
│   └── queryKeys.js       # Query key constants
├── hooks/
│   └── useStations.js     # Semua custom hooks (useQuery)
├── pages/
│   ├── HomePage.jsx       # Halaman utama dashboard
│   ├── StationDetailPage.jsx  # Halaman detail satu stasiun
│   └── NotFoundPage.jsx   # Halaman 404
├── utils/
│   └── helpers.js         # Format waktu, warna, dll
├── App.jsx
├── main.jsx
└── index.css
```

## Alur Data

```
FastAPI Backend
    │
    ├── GET /map       ──► useMapStations()    ──► StationMap
    ├── GET /summary   ──► useSummary()        ──► SummaryCards
    ├── GET /off       ──► useOffStations()    ──► OffStationsTable
    └── GET /station/:id ► useStationDetail() ──► StationDetailPage
```

Semua fetching menggunakan **TanStack Query** dengan `refetchInterval` untuk auto-polling:
- Summary & Off list: setiap **30 detik**
- Map: setiap **60 detik**
- Detail stasiun: setiap **60 detik**

## Setup Development

```bash
# 1. Install dependencies
npm install

# 2. Salin env config
cp .env.example .env.local
# Edit VITE_API_BASE_URL jika perlu

# 3. Jalankan dev server
npm run dev
# → http://localhost:3000
# → /api/* otomatis di-proxy ke FastAPI di port 8000
```

## Build Production

```bash
npm run build
# Output di folder: dist/
```

## Deploy ke VM (Nginx)

```bash
# Build frontend
npm run build

# Copy ke direktori web server
sudo cp -r dist/* /var/www/station-dashboard/dist/

# Aktifkan config Nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/station-monitor
sudo ln -s /etc/nginx/sites-available/station-monitor /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Dengan konfigurasi ini:
- `http://your-domain.com/` → serve React frontend
- `http://your-domain.com/api/` → proxy ke FastAPI di `localhost:8000`

## Variabel Environment

| Variable | Default | Keterangan |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base URL FastAPI backend |

## Auto-Refresh Intervals

Dapat diubah di `src/constants/api.js`:

```js
export const REFRESH_INTERVALS = {
  SUMMARY: 30_000,   // ms
  MAP:     60_000,
  OFF:     30_000,
  STATUS:  30_000,
  DETAIL:  60_000,
}
```
