
import FolderCard from '../components/FolderCard.tsx';

export default function Vault() {
  const folders = [
    { title: 'research notes', count: 24 },
    { title: 'project documents', count: 18 },
    { title: 'meeting minutes', count: 12 },
    { title: 'reference materials', count: 35 },
    { title: 'templates', count: 8 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl text-[#1f2a1f]">vault</div>
          <div className="text-sm text-black/50">your knowledge repository</div>
        </div>
        <button className="px-3 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition">get context</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
        {folders.map(f => <FolderCard key={f.title} title={f.title} count={f.count} />)}
      </div>
    </div>
  )
}
