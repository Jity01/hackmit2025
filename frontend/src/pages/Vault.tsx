import { useEffect, useMemo, useState } from 'react'
import { listVault, previewUrl } from '../lib/api'
import { Folder as FolderIcon, FileText, Film, X, ChevronRight } from 'lucide-react'
import PdfPreview from '../components/PdfPreview'

type Folder = { name: string; path: string; count: number }
type FileItem = { name: string; path: string }

export default function Vault() {
  const [path, setPath] = useState('')
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [viewer, setViewer] = useState<FileItem | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true); setErr(null)
    listVault(path)
      .then((res) => { if (!alive) return; setFolders(res.folders); setFiles(res.files) })
      .catch((e) => alive && setErr(e.message || 'failed to load'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [path])

  // esc to close viewer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setViewer(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const crumbs = useMemo(() => path.split('/').filter(Boolean), [path])
  const isPdf = (n: string) => n.toLowerCase().endsWith('.pdf')
  const isMp4 = (n: string) => n.toLowerCase().endsWith('.mp4')

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

        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => setViewer(file)}
            className="app-card text-left p-4 hover:shadow-md transition"
            title={file.name}
          >
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center mb-3">
              {isMp4(file.name) ? <Film className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="text-base text-[#1f2a1f] truncate">{file.name}</div>
            <div className="text-xs text-black/40">file</div>
          </button>
        ))}
      </div>

      {viewer && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setViewer(null)}           // click backdrop to close
        >
          <div
            className="app-card w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}     // don’t close when clicking inside
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
              <div className="text-sm text-[#1f2a1f] truncate">{viewer.name}</div>
              <button onClick={() => setViewer(null)} className="p-2 rounded-lg hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 bg-black/2">
              {isPdf(viewer.name) ? (
                <PdfPreview src={previewUrl(viewer.path)} />
              ) : isMp4(viewer.name) ? (
                <video controls className="w-full h-full bg-black" src={previewUrl(viewer.path)} />
              ) : (
                <div className="p-6 text-sm">unsupported preview</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
