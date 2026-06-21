import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Upload, GitCompare } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { AlertFeed } from '@/components/dashboard/AlertFeed'
import { TradeFilter } from '@/components/dashboard/TradeFilter'
import { useAuth } from '@/hooks/useAuth'
import { stats } from '@/lib/db'
import type { Trade } from '@/lib/utils'

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

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>(loadTradeFilters)
  const [activeTab, setActiveTab] = useState('overview')
  const [drawingCount, setDrawingCount] = useState(0)
  const [changeCount, setChangeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stats.overview().then((s) => {
      if (s) {
        setDrawingCount(s.totalDrawings)
        setChangeCount(s.openChanges)
      }
      setLoading(false)
    })
  }, [])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) navigate('/drawings')
  }

  const handleTradeChange = (trades: Trade[]) => {
    setSelectedTrades(trades)
    saveTradeFilters(trades)
  }

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
              Good morning, {firstName}.
              {drawingCount === 0 ? ' No projects yet — upload a drawing to get started.' : ` ${drawingCount} project${drawingCount !== 1 ? 's' : ''} updated overnight.`}
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
          { label: 'Total Drawings', value: loading ? '—' : String(drawingCount) },
          { label: 'Open Changes', value: loading ? '—' : String(changeCount) },
          { label: 'Risk Score', value: '—' },
          { label: 'Cost Impact', value: '$0' },
        ].map((stat, i) => (
          <AnimatedSection key={stat.label} delay={0.1 + i * 0.08}>
            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              className="bg-white rounded-[24px] p-5 shadow-subtle transition-shadow duration-300 hover:shadow-[rgba(4,23,43,0.08)_0px_0px_0px_1px,rgba(0,0,0,0.15)_0px_20px_25px_-5px,rgba(0,0,0,0.12)_0px_8px_10px_-6px]"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[13px] text-graphite font-[430]">{stat.label}</span>
              </div>
              <span className="block font-serif text-[44px] text-ink leading-none tracking-[-0.66px]">
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
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-body text-graphite">
                {drawingCount === 0 ? 'Upload a drawing to see change activity' : 'No changes detected this week'}
              </p>
            </div>
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={0.35}>
          <Card variant="warm" padding="md" hover>
            <h3 className="text-body font-[450] text-ink mb-3">Changes by Trade</h3>
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-body text-graphite text-center">
                {drawingCount === 0 ? 'No data yet' : 'No changes by trade'}
              </p>
            </div>
          </Card>
        </AnimatedSection>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        <AnimatedSection delay={0.4}>
          <Card variant="cool" padding="md" hover>
            <h3 className="text-body font-[450] text-ink mb-3">Most Changed Sheets</h3>
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-body text-graphite">
                {drawingCount === 0 ? 'No drawings uploaded yet' : 'No changes on any sheets'}
              </p>
            </div>
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={0.45}>
          <AlertFeed alerts={[]} onMarkRead={() => {}} onMarkAllRead={() => {}} />
        </AnimatedSection>
      </div>
    </div>
  )
}
