import { useState, useEffect } from 'react'
import { Bell, Loader2, CheckCheck, AlertTriangle, Plus, Minus, Pencil, ExternalLink, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { backendApi } from '@/lib/backendApi'

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  high: { icon: AlertTriangle, color: 'text-rust', bg: 'bg-red-50' },
  medium: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  low: { icon: CheckCheck, color: 'text-green-600', bg: 'bg-green-50' },
}

const TRADE_COLORS: Record<string, string> = {
  architectural: 'bg-blue-100 text-blue-700',
  structural: 'bg-purple-100 text-purple-700',
  electrical: 'bg-yellow-100 text-yellow-700',
  hvac: 'bg-cyan-100 text-cyan-700',
  plumbing: 'bg-emerald-100 text-emerald-700',
  civil: 'bg-stone-100 text-stone-700',
  other: 'bg-gray-100 text-gray-600',
}

export default function Alerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingSlack, setSendingSlack] = useState<string | null>(null)

  useEffect(() => {
    if (user) loadAlerts()
  }, [user])

  const loadAlerts = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await backendApi.listAlerts(user.id)
      setAlerts(list)
    } catch (e) {
      console.error('Failed to load alerts:', e)
    }
    setLoading(false)
  }

  const handleMarkRead = async (alertId: string) => {
    if (!user) return
    try {
      await backendApi.markAlertRead(alertId, user.id)
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)))
    } catch (e) {
      console.error('Failed to mark alert read:', e)
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    try {
      await backendApi.markAllAlertsRead(user.id)
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    } catch (e) {
      console.error('Failed to mark all read:', e)
    }
  }

  const unread = alerts.filter((a) => !a.read)

  return (
    <div className="p-6 space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-ink">Alerts</h1>
          <p className="text-body text-graphite mt-1">
            {alerts.length > 0
              ? `${alerts.length} alert${alerts.length !== 1 ? 's' : ''}${unread.length > 0 ? ` (${unread.length} unread)` : ''}`
              : 'Notifications about changes in your drawings.'}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="secondary" onClick={handleMarkAllRead} size="sm">
            <CheckCheck size={14} className="mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-graphite animate-spin" />
          </div>
        </Card>
      ) : alerts.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mb-4">
              <Bell size={24} className="text-graphite" />
            </div>
            <h3 className="text-subheading text-ink mb-1">All clear</h3>
            <p className="text-body text-graphite max-w-sm text-center">
              Alerts will appear here when changes are detected between drawing revisions.
              Go to the Diffs page to compare revisions and generate alerts.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low
            const SevIcon = sev.icon
            const tradeColor = TRADE_COLORS[alert.trade] || TRADE_COLORS.other

            return (
              <Card
                key={alert.id}
                padding="md"
                variant={alert.read ? 'default' : 'warm'}
                className={alert.read ? 'opacity-70' : ''}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sev.bg}`}>
                    <SevIcon size={18} className={sev.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-subheading text-ink">{alert.title}</h3>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-rust shrink-0" />
                      )}
                    </div>
                    <p className="text-body text-graphite mb-2">{alert.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-caption">
                      <span className={`px-2 py-0.5 rounded-full font-[430] ${tradeColor}`}>
                        {alert.trade}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-[430] ${sev.bg} ${sev.color}`}>
                        {alert.severity}
                      </span>
                      {alert.sheet_name && (
                        <span className="text-graphite">{alert.sheet_name}</span>
                      )}
                      {alert.revision && (
                        <span className="text-graphite">{alert.revision}</span>
                      )}
                      <span className="text-dove/50">
                        {new Date(alert.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!alert.read && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="text-dove/40 hover:text-ink transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
