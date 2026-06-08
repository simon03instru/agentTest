import SummaryCards from '@/components/cards/SummaryCards'
import StationMap from '@/components/map/StationMap'
import OffStationsTable from '@/components/table/OffStationsTable'
import RefreshIndicator from '@/components/ui/RefreshIndicator'

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 max-w-[1800px] mx-auto animate-fade-in">

      {/* KPI Summary Cards */}
      <SummaryCards />

      {/* Map + Off Table — grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 min-h-0">

        {/* Map: 3/5 width on xl */}
        <div className="xl:col-span-3 h-[520px] xl:h-[600px]">
          <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="section-title">Peta Distribusi Stasiun</span>
              <span className="label-mono text-[10px]">Klik marker untuk detail</span>
            </div>
            <div className="flex-1 min-h-0">
              <StationMap />
            </div>
          </div>
        </div>

        {/* Off Table: 2/5 width on xl */}
        <div className="xl:col-span-2 h-[520px] xl:h-[600px] flex flex-col min-h-0">
          <OffStationsTable />
        </div>
      </div>

    </div>
  )
}
