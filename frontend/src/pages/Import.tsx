import { useMemo, useState, useRef } from 'react'
import IntegrationCard from '../components/IntegrationCard'
import { Palette, Cloud, Video, Eye, EyeOff } from 'lucide-react'
import { startRecording, extractCanvas, authenticateDrive, migrateDrive } from '../lib/api'

type CanvasCreds = { baseUrl: string; accessToken: string }
function normalizeUrl(u: string) {
  let s = (u || '').trim()
  if (!s) return s
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s
  return s.replace(/\/+$/,'')
}

export default function ImportPage() {
  // screen recorder (unchanged)
  const [open, setOpen] = useState(false)
  const [seconds, setSeconds] = useState(5)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [driveBusy, setDriveBusy] = useState(false)
  const [driveMsg, setDriveMsg] = useState<string | null>(null)
  const driveCtl = useRef<AbortController | null>(null)

  async function handleDriveConnect() {
    if (driveBusy) return
    setDriveBusy(true); setDriveMsg('authenticating…')
    const ctl = new AbortController(); driveCtl.current = ctl
    try {
      const a = await authenticateDrive({ signal: ctl.signal })
      if (!a.authenticated) throw new Error('drive auth failed')
      setDriveMsg('migrating files…')
      const m = await migrateDrive({ signal: ctl.signal })
      // adjust message based on your /migrate response shape
      setDriveMsg(m.count != null ? `migrated ${m.count} files` : 'migration complete')
    } catch (e: any) {
      setDriveMsg(e?.message || 'drive connect failed')
    } finally {
      setDriveBusy(false); driveCtl.current = null
    }
  }

  async function handleStart() {
    setBusy(true); setMsg(null)
    try {
      const res = await startRecording(seconds)
      setMsg(res.ok ? 'saved to cloud!' : 'failed')
    } catch (e: any) {
      setMsg(e?.message ?? 'failed')
    } finally {
      setBusy(false)
    }
  }

  // canvas modal
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [canvasBusy, setCanvasBusy] = useState(false)
  const [canvasMsg, setCanvasMsg] = useState<string | null>(null)

  const validCanvas = useMemo(() => {
    const u = normalizeUrl(baseUrl)
    const okUrl = /^https?:\/\/[^\/]+\.[^\/]+/i.test(u)
    return okUrl && token.trim().length > 0
  }, [baseUrl, token])

  async function submitCanvas() {
    if (!validCanvas || canvasBusy) return
    setCanvasBusy(true); setCanvasMsg(null)
    try {
      const res = await extractCanvas(normalizeUrl(baseUrl), token.trim())
      setCanvasMsg(`uploaded → ${res.gcs_path}${res.courses != null ? ` (${res.courses} courses)` : ''}`)
      setCanvasOpen(false)
      // clear inputs if you want
      setBaseUrl(''); setToken('')
    } catch (e: any) {
      setCanvasMsg(e?.message ?? 'canvas extract failed')
    } finally {
      setCanvasBusy(false)
    }
  }

  return (
    <div>
      <div className="text-xl text-[#1f2a1f]">Import</div>
      <div className="text-sm text-black/50 mb-6">Connect new data sources</div>

      {/* status banners */}
      {driveMsg && <div className="mb-3 text-sm text-black/70">drive: {driveMsg}</div>}
      {canvasMsg && <div className="mb-3 text-sm text-black/70">{canvasMsg}</div>}
      {msg && <div className="mb-3 text-sm text-black/70">{msg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* canvas card unchanged */}
        <IntegrationCard
          title="canvas"
          description="import course materials and assignments"
          Icon={Palette}
          variant="connect"
          actionLabel="connect"
          onAction={() => setCanvasOpen(true)}
        />

        {/* google drive card → hits authenticate + migrate */}
        <IntegrationCard
          title="google drive"
          description={driveBusy ? 'working…' : 'sync documents and files'}
          Icon={Cloud}
          variant="connect"
          actionLabel={driveBusy ? 'working…' : 'connect'}
          onAction={handleDriveConnect}
          connected={false}
        />

        {/* screen recording unchanged */}
        <IntegrationCard
          title="screen recording"
          description="capture and analyze recordings"
          Icon={Video}
          variant="connect"
          actionLabel="start"
          onAction={() => setOpen(true)}
        />
      </div>

      {/* canvas modal (collect + call backend; no persistence) */}
      {canvasOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="app-card w-full max-w-md p-5">
            <div className="text-lg text-[#1f2a1f]">connect canvas</div>
            <div className="text-sm text-black/50 mb-4">enter your base url and access token</div>

            <label className="text-sm text-[#1f2a1f]">base url</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="https://canvas.mit.edu"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              inputMode="url"
              autoFocus
            />
            <p className="text-xs text-black/40 mt-1">example: https://canvas.yourschool.edu</p>

            <label className="block mt-4 text-sm text-[#1f2a1f]">access token</label>
            <div className="mt-1 flex items-stretch gap-2">
              <input
                className="w-full px-3 py-2 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="paste token…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                type={showToken ? 'text' : 'password'}
                autoComplete="off"
              />
              <button
                className="px-3 rounded-xl border border-black/10 hover:bg-black/5"
                onClick={() => setShowToken(s => !s)}
                title={showToken ? 'hide' : 'show'}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCanvasOpen(false)} className="px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10">
                cancel
              </button>
              <button
                onClick={submitCanvas}
                disabled={!validCanvas || canvasBusy}
                className="px-3 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {canvasBusy ? 'connecting…' : 'continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* screen recording modal */}
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
              className="mt-1 w-full px-3 py-2 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
            />

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
