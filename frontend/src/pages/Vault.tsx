import { useEffect, useMemo, useState } from 'react'
import { listVault, previewUrl } from '../lib/api'
import { Folder as FolderIcon, FileText, Film, X, ChevronRight, Home, Search, Grid3X3, List, Archive, Filter } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr(null)
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

  // ESC to close viewer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewer(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const crumbs = useMemo(() => path.split('/').filter(Boolean), [path])
  const isPdf = (n: string) => n.toLowerCase().endsWith('.pdf')
  const isMp4 = (n: string) => n.toLowerCase().endsWith('.mp4')

  // Filter items based on search
  const filteredFolders = useMemo(() =>
    folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  , [folders, searchQuery])

  const filteredFiles = useMemo(() =>
    files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  , [files, searchQuery])

  const totalItems = filteredFolders.length + filteredFiles.length

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
              Vault
            </h1>
            <p className="text-xl text-gray-400">Your knowledge repository</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
            Get Context
          </button>
        </div>

        {/* Navigation & Search */}
        <div className="rounded-3xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 mb-12">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-between mb-6">
            <nav className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                onClick={() => setPath('')}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              {crumbs.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  <button
                    className="px-4 py-2 rounded-xl bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white transition-colors font-medium"
                    onClick={() => setPath(crumbs.slice(0, i + 1).join('/') + '/')}
                  >
                    {seg}
                  </button>
                </div>
              ))}
            </nav>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-700/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-white placeholder-gray-400"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4" />
              {filteredFolders.length} folders
            </span>
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {filteredFiles.length} files
            </span>
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {totalItems} total
            </span>
          </div>
        </div>
{/* Error State */}
{err && (
          <div className="rounded-3xl bg-red-900/30 border border-red-500/30 p-6 mb-8 backdrop-blur-md">
            <div className="flex items-center gap-4 text-red-300">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <X className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Unable to load vault</h3>
                <p className="text-sm text-red-400">{err}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="rounded-3xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-16 text-center">
            <div className="w-12 h-12 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Loading vault</h3>
            <p className="text-gray-400">Gathering your files...</p>
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFolders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => setPath(folder.path)}
                className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 hover:border-indigo-500/50 p-6 text-left hover:bg-slate-700/50 transition-all duration-300 hover:scale-105"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FolderIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white truncate mb-1">{folder.name}</h3>
                <p className="text-sm text-gray-400">{folder.count} items</p>
              </button>
            ))}

            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setViewer(file)}
                className="group relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 hover:border-slate-500/50 p-6 text-left hover:bg-slate-700/50 transition-all duration-300 hover:scale-105"
                title={file.name}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${
                  isPdf(file.name)
                    ? 'bg-gradient-to-br from-red-500 to-pink-600'
                    : isMp4(file.name)
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-br from-gray-500 to-slate-600'
                }`}>
                  {isMp4(file.name) ? (
                    <Film className="w-6 h-6 text-white" />
                  ) : (
                    <FileText className="w-6 h-6 text-white" />
                  )}
                </div>
                <h3 className="font-semibold text-white truncate mb-1">{file.name}</h3>
                <p className="text-sm text-gray-400">
                  {isPdf(file.name) ? 'PDF' : isMp4(file.name) ? 'Video' : 'File'}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && (
          <div className="rounded-3xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 overflow-hidden">
            {/* Folders */}
            {filteredFolders.map((folder, index) => (
              <button
                key={folder.path}
                onClick={() => setPath(folder.path)}
                className={`w-full flex items-center gap-4 p-6 text-left hover:bg-slate-700/50 transition-colors ${
                  index !== 0 || filteredFiles.length > 0 ? 'border-b border-slate-700/50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FolderIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{folder.name}</h3>
                  <p className="text-sm text-gray-400">{folder.count} items</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}

            {/* Files */}
            {filteredFiles.map((file, index) => (
              <button
                key={file.path}
                onClick={() => setViewer(file)}
                className={`w-full flex items-center gap-4 p-6 text-left hover:bg-slate-700/50 transition-colors ${
                  index < filteredFiles.length - 1 ? 'border-b border-slate-700/50' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isPdf(file.name)
                    ? 'bg-gradient-to-br from-red-500 to-pink-600'
                    : isMp4(file.name)
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-br from-gray-500 to-slate-600'
                }`}>
                  {isMp4(file.name) ? (
                    <Film className="w-5 h-5 text-white" />
                  ) : (
                    <FileText className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{file.name}</h3>
                  <p className="text-sm text-gray-400">
                    {isPdf(file.name) ? 'PDF Document' : isMp4(file.name) ? 'Video File' : 'File'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && totalItems === 0 && (
          <div className="rounded-3xl bg-slate-800/30 backdrop-blur-md border border-slate-700/30 p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              {searchQuery ? 'No matches found' : 'Vault is empty'}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? `No files or folders match "${searchQuery}"`
                : 'Import some files to get started with your vault'
              }
            </p>
          </div>
        )}

        {/* File Viewer Modal */}
        {viewer && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50"
            onClick={() => setViewer(null)}
          >
            <div
              className="relative w-full max-w-6xl h-[90vh] rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isPdf(viewer.name)
                      ? 'bg-gradient-to-br from-red-500 to-pink-600'
                      : isMp4(viewer.name)
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        : 'bg-gradient-to-br from-gray-500 to-slate-600'
                  }`}>
                    {isMp4(viewer.name) ? (
                      <Film className="w-5 h-5 text-white" />
                    ) : (
                      <FileText className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white truncate max-w-xl">{viewer.name}</h3>
                    <p className="text-sm text-gray-400">
                      {isPdf(viewer.name) ? 'PDF Document' : isMp4(viewer.name) ? 'Video File' : 'File'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewer(null)}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="h-[calc(90vh-80px)]">
                {isPdf(viewer.name) ? (
                  <PdfPreview src={previewUrl(viewer.path)} />
                ) : isMp4(viewer.name) ? (
                  <video
                    controls
                    className="w-full h-full bg-black"
                    src={previewUrl(viewer.path)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-800/30">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Preview not available</h3>
                      <p className="text-gray-400">This file type cannot be previewed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
