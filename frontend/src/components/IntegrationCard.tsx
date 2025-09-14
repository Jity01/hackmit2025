import { Check } from 'lucide-react'
import type { ComponentType } from 'react'

type Props = {
  title: string
  description: string
  Icon: ComponentType<{ className?: string }>
  variant?: 'connect' | 'manage'
  connected?: boolean
  onAction?: () => void             // <-- add this
  actionLabel?: string              // <-- optional custom label
}

export default function IntegrationCard({
  title, description, Icon, variant='connect', connected=false, onAction, actionLabel
}: Props) {
  return (
    <div className="app-card p-5 flex flex-col gap-4">
      <div className="relative h-12 w-12 rounded-2xl bg-brand-100 border border-black/5 flex items-center justify-center">
        <Icon className="h-6 w-6 text-brand-700" />
        {connected && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white border border-green-200 text-green-600 flex items-center justify-center">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="text-[#1f2a1f]">{title}</div>
        <div className="text-sm text-black/50">{description}</div>
      </div>
      <div>
        <button
          onClick={onAction}
          className={
            variant === 'manage'
              ? 'px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-[#1f2a1f]'
              : 'px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white'
          }
        >
          {actionLabel ?? variant}
        </button>
      </div>
    </div>
  )
}
