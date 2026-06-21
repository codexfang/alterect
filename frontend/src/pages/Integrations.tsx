import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, X, Loader2, ExternalLink, FolderSync, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'

const integrationList = [
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Auto-ingest drawings from Dropbox folders',
    features: ['Automatically sync new drawings from linked folders', 'Detect file updates and trigger new revisions'],
    icon: FolderSync,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive change alerts in your Slack channels',
    features: ['Post change detection alerts to a Slack channel', 'Get notified when high-severity changes are found'],
    icon: Bell,
  },
]

const BACKEND_URL = 'http://localhost:8000'

export default function Integrations() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const connectedParam = searchParams.get('connected')
    const errorParam = searchParams.get('error')
    if (connectedParam) {
      setSuccessMsg(`${integrationList.find((i) => i.id === connectedParam)?.name ?? connectedParam} connected successfully!`)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
    if (errorParam) {
      setSuccessMsg(null)
    }
    loadStatus()
  }, [searchParams])

  const loadStatus = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/oauth/status?uid=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setConnected(new Set(data.connected))
      }
    } catch (e) {
      console.error('Failed to load OAuth status:', e)
    }
    setLoading(false)
  }

  const handleConnect = (id: string) => {
    if (!user) return
    window.location.href = `${BACKEND_URL}/api/oauth/${id}/login?uid=${user.id}`
  }

  const handleDisconnect = async (id: string) => {
    if (!user) return
    setToggling(id)
    try {
      await fetch(`${BACKEND_URL}/api/oauth/${id}/disconnect?uid=${user.id}`, { method: 'POST' })
      setConnected((prev) => { const next = new Set(prev); next.delete(id); return next })
    } catch (e) {
      console.error('Failed to disconnect:', e)
    }
    setToggling(null)
  }

  return (
    <div className="p-6 space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-ink">Integrations</h1>
          <p className="text-body text-graphite mt-1">Connect your tools to automate drawing ingestion.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-body text-green-800">
          <Check size={16} className="shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrationList.map((integration) => {
          const Icon = integration.icon
          const isConnected = connected.has(integration.id)
          const isBusy = toggling === integration.id

          return (
            <Card key={integration.id} padding="md" hover className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isConnected ? 'bg-rust/10' : 'bg-fog'}`}>
                  <Icon size={18} className={isConnected ? 'text-rust' : 'text-graphite'} />
                </div>
                <div>
                  <h3 className="text-body font-[450] text-ink">{integration.name}</h3>
                </div>
              </div>
              <p className="text-[13px] text-graphite leading-relaxed mb-3">{integration.description}</p>

              {isConnected && (
                <div className="space-y-1 mb-3">
                  {integration.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-graphite">
                      <Check size={12} className="text-green-600 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto">
                <Button
                  variant={isConnected ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                  disabled={isBusy || loading || !user}
                  onClick={() => isConnected ? handleDisconnect(integration.id) : handleConnect(integration.id)}
                >
                  {isBusy ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : isConnected ? (
                    <><X size={14} className="mr-1.5" />Disconnect</>
                  ) : (
                    <><ExternalLink size={14} className="mr-1.5" />Connect</>
                  )}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {connected.size > 0 && (
        <Card padding="md" variant="warm">
          <div className="flex items-center gap-2 text-body text-ink">
            <Check size={16} className="text-rust shrink-0" />
            <span>{connected.size} integration{connected.size !== 1 ? 's' : ''} connected</span>
          </div>
        </Card>
      )}
    </div>
  )
}
