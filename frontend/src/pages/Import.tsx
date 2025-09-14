import { useState } from 'react'
import IntegrationCard from '../components/IntegrationCard'
import { Palette, Cloud, Video } from 'lucide-react'
import { startRecording } from '../lib/api'

export default function ImportPage() {
  const [open, setOpen] = useState(false)
  const [seconds, setSeconds] = useState(5)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleStart() {
    setBusy(true); setMsg(null)
    try {
      const res = await startRecording(seconds)
      setMsg(res.ok ? `saved to cloud!}` : 'failed')
    } catch (e: any) {
      setMsg(e.message ?? 'failed')
    } finally {
      setBusy(false)
    }
  }

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
          actionLabel="start"
          onAction={() => setOpen(true)}
        />
      </div>

      {/* simple modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="app-card w-full max-w-md p-5">
            <div className="text-lg text-[#1f2a1f]">start screen recording</div>
            <div className="text-sm text-black/50 mb-4">set duration and start</div>

            <label className="text-sm text-[#1f2a1f]">seconds</label>
            <input
              type="number" min={1}
              value={seconds}
              onChange={(e) => setSeconds(Math.max(1, parseInt(e.target.value || '0')))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />

            {msg && <div className="mt-3 text-sm text-black/70">{msg}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10">
                cancel
              </button>
              <button
                onClick={handleStart}
                disabled={busy}
                className="px-3 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? 'starting…' : 'start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

