import { useEffect, useMemo, useState } from 'react'
import { listVault } from '../lib/api'
import { Folder as FolderIcon, FileText, Film, ChevronRight } from 'lucide-react'

type Folder = { name: string; path: string; count: number }
type FileItem = { name: string; path: string }

export default function Vault() {
  const [path, setPath] = useState('')                 // '' == root
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true); setErr(null)
    listVault(path)
      .then((res) => {
        if (!alive) return
        setFolders(res.folders)
        setFiles(res.files)
      })
      .catch((e) => alive && setErr(e.message || 'failed to load'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [path])

  const crumbs = useMemo(() => path.split('/').filter(Boolean), [path])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl text-[#1f2a1f]">vault</div>
          <div className="text-sm text-black/50">your knowledge repository</div>
        </div>
        <button className="px-3 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition">
          get context
        </button>
      </div>

      {/* breadcrumbs */}
      <div className="mt-4 text-sm text-black/60 flex items-center gap-1">
        <button className="hover:underline" onClick={() => setPath('')}>root</button>
        {crumbs.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button
              className="hover:underline"
              onClick={() => setPath(crumbs.slice(0, i + 1).join('/') + '/')}
            >
              {seg}
            </button>
          </span>
        ))}
      </div>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      {loading && <div className="mt-3 text-sm">loading…</div>}

      {/* folders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
        {folders.map((f) => (
          <button
            key={f.path}
            onClick={() => setPath(f.path)}
            className="app-card text-left p-4 hover:shadow-md transition"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eaf4ea] flex items-center justify-center mb-3">
              <FolderIcon className="h-5 w-5 text-[#1f7a1f]" />
            </div>
            <div className="text-base text-[#1f2a1f] truncate">{f.name}</div>
            <div className="text-xs text-black/50">{f.count} items</div>
          </button>
        ))}

        {/* files in the current folder */}
        {files.map((file) => {
          const isMp4 = file.name.toLowerCase().endsWith('.mp4')
          return (
            <div key={file.path} className="app-card p-4">
              <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center mb-3">
                {isMp4 ? <Film className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div className="text-base text-[#1f2a1f] truncate" title={file.name}>
                {file.name}
              </div>
              <div className="text-xs text-black/40">file</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
