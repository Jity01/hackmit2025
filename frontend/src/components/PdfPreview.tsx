import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'

// point worker to the package’s worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export default function PdfPreview({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [scale, setScale] = useState(1)
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  useEffect(() => {
    let canceled = false
    ;(async () => {
      // load via xhr; won’t trigger a browser download
      const loadingTask = pdfjsLib.getDocument({ url: src, withCredentials: false })
      const pdf = await loadingTask.promise
      if (canceled) return
      pdfRef.current = pdf
      setPageCount(pdf.numPages)
      setPageNum(1)
    })().catch(() => {})
    return () => { canceled = true }
  }, [src])

  useEffect(() => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return
    ;(async () => {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const ctx = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
    })()
  }, [pageNum, scale])

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-black/10 flex items-center gap-2 text-sm">
        <button className="px-2 py-1 rounded hover:bg-black/5" onClick={() => setPageNum(n => Math.max(1, n-1))}>prev</button>
        <div>{pageNum} / {pageCount}</div>
        <button className="px-2 py-1 rounded hover:bg-black/5" onClick={() => setPageNum(n => Math.min(pageCount, n+1))}>next</button>
        <div className="ml-auto flex items-center gap-2">
          <button className="px-2 py-1 rounded hover:bg-black/5" onClick={() => setScale(s => Math.max(0.5, s-0.2))}>-</button>
          <div>{Math.round(scale*100)}%</div>
          <button className="px-2 py-1 rounded hover:bg-black/5" onClick={() => setScale(s => Math.min(3, s+0.2))}>+</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto grid place-items-center bg-black/2">
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>
    </div>
  )
}
