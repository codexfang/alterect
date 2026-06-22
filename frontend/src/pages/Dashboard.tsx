import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Upload, GitCompare } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { AlertFeed } from '@/components/dashboard/AlertFeed'
import { TradeFilter } from '@/components/dashboard/TradeFilter'
import { useAuth } from '@/hooks/useAuth'
import { backendApi } from '@/lib/backendApi'
import { cn, TRADE_DOT_COLORS, type Trade } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

function AnimatedSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const STORAGE_KEY = 'alterect-trade-filters'

function loadTradeFilters(): Trade[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as Trade[]
  } catch {}
  return []
}

function saveTradeFilters(trades: Trade[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades))
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDay(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>(loadTradeFilters)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  const [drawings, setDrawings] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [riskScores, setRiskScores] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      backendApi.listDrawings(user.id),
      backendApi.listProjects(user.id),
      backendApi.listAlerts(user.id),
      backendApi.listRiskScores(user.id, 50),
    ]).then(([d, p, a, r]) => {
      setDrawings(d)
      setProjects(p)
      setAlerts(a)
      setRiskScores(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const totalDrawings = drawings.length
  const totalProjects = projects.length
  const openChanges = alerts.reduce((s, a) => s + (a.change_count || 0), 0)
  const latestRisk = riskScores[0]
  const latestRiskScore = latestRisk?.score ?? null
  const latestRiskLevel = latestRisk?.level ?? null

  const costImpact = useMemo(() => {
    if (openChanges === 0) return '$0'
    const perChange = latestRiskLevel === 'high' ? 1000 : latestRiskLevel === 'medium' ? 500 : 200
    const total = openChanges * perChange
    if (total >= 1000) return `$${(total / 1000).toFixed(1)}K`
    return `$${total}`
  }, [openChanges, latestRiskLevel])

  const filteredAlerts = useMemo(() => {
    if (selectedTrades.length === 0) return alerts
    return alerts.filter((a) => selectedTrades.includes(a.trade))
  }, [alerts, selectedTrades])

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) navigate('/drawings')
  }

  const handleTradeChange = (trades: Trade[]) => {
    setSelectedTrades(trades)
    saveTradeFilters(trades)
  }

  const handleMarkRead = async (id: string) => {
    if (!user) return
    try {
      await backendApi.markAlertRead(id, user.id)
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    try {
      await backendApi.markAllAlertsRead(user.id)
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    } catch {}
  }

  const alertItems = useMemo(() => {
    const items = filteredAlerts.slice(0, 10).map((a: any) => ({
      id: a.id,
      title: a.title,
      trade: (TRADE_DOT_COLORS[a.trade] ? a.trade : 'other') as Trade,
      sheet: a.sheet_name || 'Unknown',
      revision: a.revision ? a.revision.replace('Rev ', '') : '',
      time: timeAgo(a.created_at),
      read: a.read,
    }))
    return items
  }, [filteredAlerts])

  const changesByTrade = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of alerts) {
      const trade = a.trade || 'other'
      map[trade] = (map[trade] || 0) + (a.change_count || 1)
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
  }, [alerts])

  const maxTradeCount = changesByTrade.length ? Math.max(...changesByTrade.map(([, c]) => c)) : 1

  const sortedSheets = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of alerts) {
      const sheet = a.sheet_name || 'Unknown'
      map[sheet] = (map[sheet] || 0) + 1
    }
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 5)
  }, [alerts])

  const activityData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of alerts) {
      const day = a.created_at?.split('T')[0]
      if (day) map[day] = (map[day] || 0) + 1
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
  }, [alerts])

  const maxActivity = activityData.length ? Math.max(...activityData.map(([, c]) => c)) : 1
  const hasData = drawings.length > 0 || alerts.length > 0

  return (
    <div className="p-6 space-y-6 pb-16">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.dwg,.dwf,.png,.jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-heading-sm text-ink"
            >
              Dashboard
            </motion.h1>
            <p className="text-body text-graphite mt-1">
              {loading ? 'Loading...' : !hasData
                ? `Good morning, ${firstName}. No projects yet — upload a drawing to get started.`
                : `Good morning, ${firstName}. ${totalDrawings} drawing${totalDrawings !== 1 ? 's' : ''} across ${totalProjects} project${totalProjects !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/diffs')}>
              <GitCompare size={16} className="mr-1.5" />
              Run Diff
            </Button>
            <Button size="sm" onClick={handleUploadClick}>
              <Upload size={16} className="mr-1.5" />
              Upload Drawing
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* Tabs + Filter */}
      <AnimatedSection delay={0.1}>
        <div className="flex items-center justify-between">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'changes', label: 'Changes' },
              { id: 'risk', label: 'Risk Analysis' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
          <TradeFilter selected={selectedTrades} onChange={handleTradeChange} />
        </div>
      </AnimatedSection>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Drawings', value: loading ? '—' : String(totalDrawings) },
          { label: 'Open Changes', value: loading ? '—' : String(openChanges), highlight: openChanges > 0 },
          { label: 'Risk Score', value: loading ? '—' : latestRiskScore !== null ? String(latestRiskScore) : '—' },
          { label: 'Cost Impact', value: loading ? '—' : costImpact },
        ].map((stat, i) => (
          <AnimatedSection key={stat.label} delay={0.1 + i * 0.08}>
            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              className="bg-white rounded-[24px] p-5 shadow-subtle transition-shadow duration-300 hover:shadow-[rgba(4,23,43,0.08)_0px_0px_0px_1px,rgba(0,0,0,0.15)_0px_20px_25px_-5px,rgba(0,0,0,0.12)_0px_8px_10px_-6px]"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[13px] text-graphite font-[430]">{stat.label}</span>
                {(stat as any).highlight && (
                  <span className="w-2 h-2 rounded-full bg-rust animate-pulse shrink-0" />
                )}
              </div>
              <span className={cn(
                'block font-serif text-[44px] text-ink leading-none tracking-[-0.66px]',
                stat.value === '—' && 'text-dove'
              )}>
                {stat.value}
              </span>
            </motion.div>
          </AnimatedSection>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        <AnimatedSection delay={0.3} className="col-span-2">
          <Card padding="md" hover>
            <h3 className="text-body font-[450] text-ink mb-3">Change Activity (this week)</h3>
            {activityData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-body text-graphite">
                  {loading ? 'Loading...' : hasData ? 'No changes detected this week' : 'Upload a drawing to see change activity'}
                </p>
              </div>
            ) : (
              <div className="h-[220px] flex items-end gap-2 pr-2">
                {activityData.map(([day, count]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[11px] text-graphite font-[450]">{count}</span>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(6, (count / maxActivity) * 140)}px`,
                        backgroundColor: count > maxActivity * 0.7 ? '#8B3A2A' : count > maxActivity * 0.4 ? '#A8583C' : '#E8D1C6',
                      }}
                    />
                    <span className="text-[10px] text-dove">{formatDay(day)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={0.35}>
          <Card variant="warm" padding="md" hover>
            <h3 className="text-body font-[450] text-ink mb-3">Changes by Trade</h3>
            {changesByTrade.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-body text-graphite text-center">
                  {loading ? 'Loading...' : 'No changes detected'}
                </p>
              </div>
            ) : (
              <div className="h-[220px] flex flex-col justify-center gap-3">
                {changesByTrade.map(([trade, count]) => (
                  <div key={trade} className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: TRADE_DOT_COLORS[trade] || '#ccc' }}
                    />
                    <span className="text-[13px] text-ink w-24 capitalize truncate">{trade}</span>
                    <div className="flex-1 h-2.5 bg-dove/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / maxTradeCount) * 100}%`,
                          backgroundColor: TRADE_DOT_COLORS[trade] || '#ccc',
                        }}
                      />
                    </div>
                    <span className="text-[13px] text-graphite w-8 text-right tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </AnimatedSection>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        <AnimatedSection delay={0.4}>
          <Card variant="cool" padding="md" hover>
            <h3 className="text-body font-[450] text-ink mb-3">Most Changed Sheets</h3>
            {sortedSheets.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-body text-graphite">
                  {loading ? 'Loading...' : hasData ? 'No changes on any sheets' : 'No drawings uploaded yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-dove/10">
                {sortedSheets.map(([sheet, count], i) => (
                  <div key={sheet} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[12px] text-dove w-5 shrink-0">{i + 1}.</span>
                      <span className="text-[13px] text-ink truncate">{sheet}</span>
                    </div>
                    <span className="text-[13px] text-graphite shrink-0 ml-3">{count} change{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={0.45}>
          <AlertFeed alerts={alertItems} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} />
        </AnimatedSection>
      </div>
    </div>
  )
}
