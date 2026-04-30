/**
 * Transform data dari GET /summary ke shape yang mudah dipakai UI.
 *
 * Input dari API:
 * {
 *   "items": [
 *     { "tipe_station": "aaws", "status_realtime": "ON",      "total": 104 },
 *     { "tipe_station": "aaws", "status_realtime": "OFF",     "total": 3   },
 *     { "tipe_station": "arg",  "status_realtime": "ON",      "total": 725 },
 *     { "tipe_station": "arg",  "status_realtime": "NO DATA", "total": 12  },
 *     ...
 *   ]
 * }
 *
 * Output shape:
 * {
 *   grand_total: 1200,
 *   by_status: { ON: 900, OFF: 120, DELAY: 80, 'NO DATA': 100 },
 *   by_type: {
 *     AAWS: { total: 120, ON: 104, OFF: 3, DELAY: 5, 'NO DATA': 8 },
 *     ARG:  { total: 800, ON: 725, OFF: 40, ... },
 *     AWS:  { ... },
 *   }
 * }
 */
export function transformSummary(raw) {
  if (!raw?.items?.length) {
    return { grand_total: 0, by_status: {}, by_type: {} }
  }

  const by_status = {}
  const by_type   = {}

  for (const item of raw.items) {
    const tipe   = item.tipe_station?.toUpperCase() ?? 'UNKNOWN'
    const status = item.status_realtime ?? 'NO DATA'
    const total  = item.total ?? 0

    // Akumulasi by_status (gabungan semua tipe)
    by_status[status] = (by_status[status] ?? 0) + total

    // Akumulasi by_type
    if (!by_type[tipe]) {
      by_type[tipe] = { total: 0, ON: 0, OFF: 0, DELAY: 0, 'NO DATA': 0 }
    }
    by_type[tipe][status] = (by_type[tipe][status] ?? 0) + total
    by_type[tipe].total   += total
  }

  const grand_total = Object.values(by_status).reduce((a, b) => a + b, 0)

  return { grand_total, by_status, by_type }
}
