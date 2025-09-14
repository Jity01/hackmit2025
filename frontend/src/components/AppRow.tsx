
import { useState } from 'react'
import { Settings } from 'lucide-react'

export default function AppRow({ name, status, description }: { name: string, status: 'connected' | 'pending', description: string }) {
  const [enabled, setEnabled] = useState(status === 'connected')
  return (
    <div className="app-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-100 border border-black/5" />
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[#1f2a1f]">{name}</div>
            <span className={"text-xs px-1.5 py-0.5 rounded border " + (status==='connected' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-800 border-yellow-100')}>{status}</span>
          </div>
          <div className="text-xs text-black/50">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm text-black/70 hover:text-black inline-flex items-center gap-1">
          <Settings className="h-4 w-4" /> settings
        </button>
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <div className="w-11 h-6 bg-black/10 rounded-full peer peer-checked:bg-brand-600 transition relative">
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
          </div>
        </label>
      </div>
    </div>
  )
}
