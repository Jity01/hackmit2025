import { useMemo, useState, useRef, useEffect } from 'react'
import IntegrationCard from '../components/IntegrationCard'
import { Palette, Cloud, Video, Eye, EyeOff, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { startRecording, extractCanvas, migrateDrive, authenticateDrive } from '../lib/api'

type CanvasCreds = { baseUrl: string; accessToken: string }

function normalizeUrl(u: string) {
  let s = (u || '').trim()
  if (!s) return s
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s
  return s.replace(/\/+$/, '')
}

export default function ImportPage() {
  // screen recorder
  const [open, setOpen] = useState(false)
  const [seconds, setSeconds] = useState(5)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // canvas
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [canvasBusy, setCanvasBusy] = useState(false)
  const [canvasMsg, setCanvasMsg] = useState<string | null>(null)

  // Google Drive state
  const [connected, setConnected] = useState(false)
  const [driveBusy, setDriveBusy] = useState(false)
  const [driveMsg, setDriveMsg] = useState<string | null>(null)
  const [migrated, setMigrated] = useState(false)
  const [migrateBusy, setMigrateBusy] = useState(false)
  const [migrateMsg, setMigrateMsg] = useState<string | null>(null)

  const validCanvas = useMemo(() => {
    const u = normalizeUrl(baseUrl)
    const okUrl = /^https?:\/\/[^\/]+\.[^\/]+/i.test(u)
    return okUrl && token.trim().length > 0
  }, [baseUrl, token])

  // Check authentication status on component mount
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch('/api/drive_status')
        const data = await response.json()
        setConnected(data.authenticated)
      } catch (error) {
        console.error('Failed to check auth status:', error)
      }
    }
    checkAuthStatus()
  }, [])

  // --- handlers ---

  async function handleStart() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await startRecording(seconds)
      setMsg(res.ok ? 'saved to cloud!' : 'failed')
    } catch (e: any) {
      setMsg(e?.message ?? 'failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleCanvasSubmit() {
    if (!validCanvas || canvasBusy) return
    setCanvasBusy(true)
    setCanvasMsg(null)
    try {
      const res = await extractCanvas(normalizeUrl(baseUrl), token.trim())
      setCanvasMsg(
        `uploaded → ${res.gcs_path}${
          res.courses != null ? ` (${res.courses} courses)` : ''
        }`
      )
      setCanvasOpen(false)
      setBaseUrl('')
      setToken('')
    } catch (e: any) {
      setCanvasMsg(e?.message ?? 'canvas extract failed')
    } finally {
      setCanvasBusy(false)
    }
  }

  async function handleAuthenticate() {
    if (driveBusy) return
    setDriveBusy(true)
    setDriveMsg('authenticating…')

    try {
      const result = await authenticateDrive()
      if (result.authenticated) {
        setConnected(true)
        setDriveMsg('authenticated successfully')
      } else {
        setDriveMsg('authentication failed')
      }
    } catch (error: any) {
      setDriveMsg(error?.message || 'authentication failed')
    } finally {
      setDriveBusy(false)
    }
  }

  async function handleMigrate() {
    if (migrateBusy || !connected) return
    setMigrateBusy(true)
    setMigrateMsg('migrating files…')

    try {
      const result = await migrateDrive()
      setMigrated(true)
      setMigrateMsg(
        result.count != null
          ? `migrated ${result.count} files`
          : 'migration complete'
      )
    } catch (error: any) {
      setMigrateMsg(error?.message || 'migration failed')
    } finally {
      setMigrateBusy(false)
    }
  }

  // --- JSX ---
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
            Import
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Connect your data sources and bring everything together
          </p>
        </div>

        {/* Status Messages */}
        {(driveMsg || migrateMsg || canvasMsg || msg) && (
          <div className="mb-12 space-y-4">
            {driveMsg && (
              <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-md border ${
                driveMsg.includes('successfully') || driveMsg.includes('authenticated')
                  ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-400/30 text-red-300'
              }`}>
                {driveMsg.includes('successfully') || driveMsg.includes('authenticated') ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">Drive: {driveMsg}</span>
              </div>
            )}
            {migrateMsg && (
              <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-md border ${
                migrateMsg.includes('migrated') || migrateMsg.includes('complete')
                  ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-400/30 text-red-300'
              }`}>
                {migrateMsg.includes('migrated') || migrateMsg.includes('complete') ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">Migration: {migrateMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Integration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">

          {/* Canvas Card */}
          <div
            onClick={() => setCanvasOpen(true)}
            className="group cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-900/50 to-pink-900/50 backdrop-blur-md border border-orange-500/20 hover:border-orange-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-8">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Canvas LMS</h3>
                <p className="text-gray-400 leading-relaxed">Import course materials, assignments, and educational content</p>
              </div>
              <div className="flex items-center text-orange-400 font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Connect
              </div>
            </div>
          </div>

          {/* Google Drive Card */}
          <div className="space-y-6">
            <div
              onClick={handleAuthenticate}
              className={`group cursor-pointer relative overflow-hidden rounded-3xl backdrop-blur-md border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
                connected
                  ? 'bg-gradient-to-br from-emerald-900/50 to-blue-900/50 border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-emerald-500/10'
                  : 'bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border-blue-500/20 hover:border-blue-400/40 hover:shadow-blue-500/10'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                connected ? 'from-emerald-600/5' : 'from-blue-600/5'
              } to-transparent`}></div>
              <div className="relative p-8">
                <div className="mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${
                    connected
                      ? 'bg-gradient-to-br from-emerald-500 to-blue-600'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    <Cloud className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Google Drive</h3>
                  <p className="text-gray-400 leading-relaxed">Sync documents and files from your drive</p>
                </div>
                <div className={`flex items-center font-medium ${
                  connected ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  {connected ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Connected
                    </>
                  ) : driveBusy ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Migration Panel */}
            {connected && (
              <div className="rounded-3xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Ready to migrate</h4>
                    <p className="text-sm text-gray-400">Transfer files to your vault</p>
                  </div>
                </div>

                <button
                  onClick={handleMigrate}
                  disabled={migrateBusy || migrated}
                  className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    migrated
                      ? 'bg-emerald-600 text-white cursor-default'
                      : migrateBusy
                        ? 'bg-yellow-600 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                  }`}
                >
                  {migrated
                    ? 'Migration complete'
                    : migrateBusy
                      ? 'Migrating files...'
                      : 'Start migration'
                  }
                </button>
              </div>
            )}
          </div>

          {/* Screen Recording Card */}
          <div
            onClick={() => setOpen(true)}
            className="group cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900/50 to-purple-900/50 backdrop-blur-md border border-red-500/20 hover:border-red-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-8">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Screen Recording</h3>
                <p className="text-gray-400 leading-relaxed">Capture and analyze your screen activities</p>
              </div>
              <div className="flex items-center text-red-400 font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Start Recording
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Modal */}
      {canvasOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md">
            <div className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connect Canvas</h2>
                <p className="text-gray-400">Enter your Canvas credentials</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Canvas URL</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-500"
                    placeholder="https://canvas.yourschool.edu"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    inputMode="url"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Access Token</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/50 border border-slate-600/50 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder-gray-500"
                      placeholder="Paste your access token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      type={showToken ? 'text' : 'password'}
                      autoComplete="off"
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setCanvasOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-gray-300 hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCanvasSubmit}
                  disabled={!validCanvas || canvasBusy}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {canvasBusy ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Recording Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md">
            <div className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Screen Recording</h2>
                <p className="text-gray-400">Set recording duration</p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  min={1}
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(1, parseInt(e.target.value || '0')))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-white placeholder-gray-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-gray-300 hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  disabled={busy}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-purple-600 text-white hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {busy ? 'Starting...' : 'Start Recording'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
