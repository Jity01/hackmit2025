import { Cloud, FileText, MessageCircle, Github, CheckCircle, Clock, Settings } from 'lucide-react'

type AppStatus = 'connected' | 'pending' | 'disconnected'

interface AppRowProps {
  name: string
  status: AppStatus
  description: string
  icon: React.ComponentType<{ className?: string }>
}

function AppRow({ name, status, description, icon: Icon }: AppRowProps) {
  const getStatusConfig = (status: AppStatus) => {
    switch (status) {
      case 'connected':
        return {
          bg: 'bg-emerald-900/30',
          border: 'border-emerald-500/30',
          iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
          statusIcon: CheckCircle,
          statusText: 'Connected',
          statusColor: 'text-emerald-300'
        }
      case 'pending':
        return {
          bg: 'bg-yellow-900/30',
          border: 'border-yellow-500/30',
          iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-600',
          statusIcon: Clock,
          statusText: 'Pending',
          statusColor: 'text-yellow-300'
        }
      case 'disconnected':
        return {
          bg: 'bg-slate-800/30',
          border: 'border-slate-600/30',
          iconBg: 'bg-gradient-to-br from-slate-500 to-gray-600',
          statusIcon: Settings,
          statusText: 'Disconnected',
          statusColor: 'text-gray-400'
        }
    }
  }

  const config = getStatusConfig(status)
  const StatusIcon = config.statusIcon

  return (
    <div className={`rounded-2xl backdrop-blur-md border p-6 transition-all duration-300 hover:scale-[1.01] hover:border-opacity-50 ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.iconBg}`}>
          <Icon className="w-7 h-7 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold text-white capitalize">{name}</h3>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${config.statusColor}`} />
              <span className={`text-sm font-medium ${config.statusColor}`}>
                {config.statusText}
              </span>
            </div>
          </div>
          <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>

        {status === 'disconnected' && (
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
            Connect
          </button>
        )}

        {status === 'pending' && (
          <button className="px-4 py-2 bg-slate-700 text-gray-300 rounded-xl font-medium cursor-not-allowed">
            Configuring...
          </button>
        )}

        {status === 'connected' && (
          <button className="px-4 py-2 bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white rounded-xl font-medium transition-colors">
            Settings
          </button>
        )}
      </div>
    </div>
  )
}

export default function Apps() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
            Apps
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Manage your connected services and integrations
          </p>
        </div>

        {/* Apps List */}
        <div className="space-y-6">
          <AppRow
            name="google drive"
            status="connected"
            description="Cloud storage and file synchronization service"
            icon={Cloud}
          />
          <AppRow
            name="notion"
            status="connected"
            description="All-in-one workspace for notes, docs, and collaboration"
            icon={FileText}
          />
          <AppRow
            name="slack"
            status="connected"
            description="Team communication and messaging platform"
            icon={MessageCircle}
          />
          <AppRow
            name="github"
            status="pending"
            description="Code repository and version control system"
            icon={Github}
          />
        </div>

        {/* Stats */}
        <div className="mt-16 rounded-2xl bg-slate-800/30 backdrop-blur-md border border-slate-700/30 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400 mb-1">3</div>
              <div className="text-sm text-gray-400">Connected Apps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">1</div>
              <div className="text-sm text-gray-400">Pending Setup</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400 mb-1">12+</div>
              <div className="text-sm text-gray-400">Available Integrations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
