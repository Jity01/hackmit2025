import { useState } from 'react'
import { LayoutGrid, Boxes, Settings, Download } from 'lucide-react'
import clsx from 'classnames'
import Vault from './pages/Vault'
import Apps from './pages/Apps'
import ImportPage from './pages/Import'

type Tab = 'vault' | 'import' | 'apps'

export default function App() {
  const [tab, setTab] = useState<Tab>('vault')

  return (
    <div className="h-screen w-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-black/5 bg-[#f7faf7]">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center border border-black/5">
            <Boxes className="h-5 w-5 text-brand-700" />
          </div>
          <span className="font-medium text-[#1f2a1f]">Basis</span>
        </div>

        <nav className="mt-4 space-y-1 px-2">
          <button onClick={() => setTab('vault')}
            className={clsx('w-full text-left px-3 py-2 rounded-lg flex items-center gap-2',
              tab==='vault' ? 'bg-brand-100 text-brand-900' : 'hover:bg-black/5')}>
            <LayoutGrid className="h-4 w-4" /> <span>Vault</span>
          </button>

          <button onClick={() => setTab('import')}
            className={clsx('w-full text-left px-3 py-2 rounded-lg flex items-center gap-2',
              tab==='import' ? 'bg-brand-100 text-brand-900' : 'hover:bg-black/5')}>
            <Download className="h-4 w-4" /> <span>Import</span>
          </button>

          <button onClick={() => setTab('apps')}
            className={clsx('w-full text-left px-3 py-2 rounded-lg flex items-center gap-2',
              tab==='apps' ? 'bg-brand-100 text-brand-900' : 'hover:bg-black/5')}>
            <Settings className="h-4 w-4" /> <span>Apps</span>
          </button>
        </nav>
      </aside>

      <main className="p-6 overflow-auto">
        {tab === 'vault' && <Vault />}
        {tab === 'import' && <ImportPage />}
        {tab === 'apps' && <Apps />}
      </main>
    </div>
  )
}
