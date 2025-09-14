
import { Folder } from 'lucide-react'

export default function FolderCard({ title, count }: { title: string, count: number }) {
  return (
    <div className="app-card p-5 hover:shadow transition-shadow">
      <div className="h-12 w-12 rounded-2xl bg-brand-100 border border-black/5 flex items-center justify-center">
        <Folder className="h-6 w-6 text-brand-700" />
      </div>
      <div className="mt-4">
        <div className="text-[#1f2a1f]">{title}</div>
        <div className="text-xs text-black/50 mt-1">{count} items</div>
      </div>
    </div>
  )
}
