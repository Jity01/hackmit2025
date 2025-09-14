import { useState } from 'react'
import { AppWindow } from 'lucide-react'

export default function AppRow({
  name,
  status,
  description
}: { name: string; status: 'connected' | 'pending'; description: string }) {
  const [enabled, setEnabled] = useState(status === 'connected')
  return (
    <div className="app-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl grid place-items-center bg-transparent border border-emerald-600/40 ring-1 ring-emerald-600/20">
          <AppWindow className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[#1f2a1f]">{name}</div>
          </div>
          <div className="text-xs text-black/50">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div className="w-11 h-6 bg-black/10 rounded-full peer peer-checked:bg-brand-600 transition relative" />
        </label>
      </div>
    </div>
  )
}
