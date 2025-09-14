import IntegrationCard from '../components/IntegrationCard'
import { Palette, Cloud, Video } from 'lucide-react'

export default function ImportPage() {
  return (
    <div>
      <div className="text-xl text-[#1f2a1f]">import</div>
      <div className="text-sm text-black/50 mb-6">connect new data sources</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <IntegrationCard
          title="canvas"
          description="import course materials and assignments"
          Icon={Palette}
          variant="connect"
        />
        <IntegrationCard
          title="google drive"
          description="sync documents and files"
          Icon={Cloud}
          variant="manage"
          connected
        />
        <IntegrationCard
          title="screen recording"
          description="capture and analyze recordings"
          Icon={Video}
          variant="connect"
        />
      </div>
    </div>
  )
}
