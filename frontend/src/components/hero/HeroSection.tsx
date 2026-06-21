import { useState, useEffect } from 'react'
import { ArrowRight, Play, Shield, GitBranch, Bell, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, Tooltip,
} from 'recharts'

const donutData = [
  { name: 'Electrical', value: 42, color: '#5d2a1a' },
  { name: 'Plumbing', value: 28, color: '#fbe1d1' },
  { name: 'Structural', value: 30, color: '#d3e3fc' },
]

const weekData = [
  { label: 'Electrical', value: 42, bar: 'w-[65%]' },
  { label: 'Structural', value: 38, bar: 'w-[50%]' },
  { label: 'Other', value: 62, bar: 'w-[80%]' },
]

const lineData = [
  { month: 'Sep', value: 18 },
  { month: 'Oct', value: 24 },
  { month: 'Nov', value: 21 },
  { month: 'Dec', value: 35 },
  { month: 'Jan', value: 42 },
  { month: 'Feb', value: 56 },
]

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  const [prog, setProg] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!loaded) return
    const start = performance.now()
    const duration = 900
    const animate = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProg(eased)
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [loaded])

  const scrollToDemo = () => {
    const el = document.getElementById('demo')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <div className="hero-glow animate-hero-glow absolute inset-0 pointer-events-none z-0" />

      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-apricot-wash/60 rounded-full mb-8 animate-card-entrance card-entrance-delay-1">
            <Shield size={14} className="text-rust" />
            <span className="text-[13px] text-rust font-[430]">Version control for construction drawings</span>
          </div>

          <h1 className="font-serif text-heading-lg text-ink max-w-5xl mx-auto leading-[1.1] tracking-[-1.6px] animate-card-entrance card-entrance-delay-2">
            Never build from the
            <br />
            <span className="text-gradient-warm">wrong drawing</span> again
          </h1>

          <p className="text-body-lg text-ash mt-6 max-w-2xl mx-auto leading-relaxed animate-card-entrance card-entrance-delay-3">
            Upload a PDF onto Alterect and it laser-compares every wall, pipe, and outlet against every past revision — each change is flagged, classified by trade, and pushed to your team before a single stud gets framed wrong.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8 animate-card-entrance card-entrance-delay-4">
            <Button size="lg" onClick={() => window.location.href = '/signup'}>
              Try it free
              <ArrowRight size={18} className="ml-1.5" />
            </Button>
            <button
              onClick={scrollToDemo}
              className="group relative flex items-center gap-2 px-5 py-2.5 text-body text-ink font-[450] rounded-full border border-dove/20 hover:border-rust/40 hover:text-rust transition-all duration-300 hover:shadow-[0_0_20px_rgba(93,42,26,0.15)] hover:scale-[1.02]"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-rust/0 via-rust/[0.02] to-rust/0 group-hover:via-rust/[0.06] transition-all duration-300" />
              <Play size={16} className="relative z-10 group-hover:text-rust transition-colors" />
              <span className="relative z-10">View demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 1 — Top-Left: Bar chart "Changes by Trade" */}
      <div className="hidden xl:block absolute top-[10%] left-[5%] z-20"
        style={{ animation: 'float1 6s ease-in-out infinite, cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards' }}
      >
        <Card padding="md" className="w-64">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={14} className="text-graphite" />
            <span className="text-[13px] text-graphite font-[430]">Changes by Trade</span>
          </div>
          <div className="flex items-end justify-around h-24 px-1 gap-3">
            {donutData.map((d) => {
              const h = d.value * prog
              return (
                <div key={d.name} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[11px] text-ink font-[450]">{Math.round(h)}%</span>
                  <div className="w-full h-[72px] bg-fog rounded-full relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-full transition-none"
                      style={{ height: `${h}%`, backgroundColor: d.color }}
                    />
                  </div>
                  <span className="text-[10px] text-graphite whitespace-nowrap">{d.name}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-auto pt-3 border-t border-dove/10 flex items-center gap-2">
            <Zap size={12} className="text-rust" />
            <span className="text-[11px] text-graphite">42% electrical — high conflict risk</span>
          </div>
        </Card>
      </div>

      {/* Card 2 — Top-Right: Stat "142 Changes Detected" */}
      <div className="hidden xl:block absolute top-[15%] right-[4%] z-20"
        style={{ animation: 'float2 7s ease-in-out infinite, cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards' }}
      >
        <Card padding="md" className="w-64">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={14} className="text-graphite" />
            <span className="text-[13px] text-graphite font-[430]">Changes This Week</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-serif text-[40px] text-ink tracking-[-0.6px] leading-none">{Math.floor(142 * prog)}</span>
            <span className="text-[13px] text-green-700 font-[450] mb-1.5">↑ 23%</span>
          </div>
          <div className="mt-3 pt-3 border-t border-dove/10 space-y-2">
            {weekData.map((item) => {
              const val = Math.round(+item.value * prog)
              const barPct = +item.value / 80 * 100 * prog
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[12px] text-graphite w-[72px] shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-fog rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rust/30 rounded-full transition-none"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-ink font-[450] w-6 text-right">{val}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Card 3 — Bottom-Left: Line chart "Drawing Revisions" */}
      <div className="hidden lg:block absolute bottom-[5%] left-[8%] z-20"
        style={{ animation: 'float3 8s ease-in-out infinite, cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s forwards' }}
      >
        <Card padding="md" variant="cool" className="w-64">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch size={15} className="text-graphite" />
            <span className="text-[13px] text-graphite font-[430]">Revisions (6 months)</span>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={lineData}>
              <Line type="monotone" dataKey="value" stroke="#5d2a1a" strokeWidth={2.5} dot={{ r: 3, fill: '#5d2a1a', strokeWidth: 2, stroke: '#fff' }} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#777b86' }} />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between text-[11px] text-graphite mt-1">
            <span>Sep</span>
            <span className="text-green-700 font-[430]">↑ 211%</span>
            <span>Feb</span>
          </div>
        </Card>
      </div>

      {/* Card 4 — Bottom-Right: Alert preview with avatar */}
      <div className="hidden lg:block absolute bottom-[8%] right-[6%] z-20"
        style={{ animation: 'float4 9s ease-in-out infinite, cardEntrance 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s forwards' }}
      >
        <Card padding="md" className="w-64">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-rust" />
            <span className="text-[13px] text-graphite font-[430]">Latest Alert</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-rust mt-1.5 shrink-0" />
            <div>
              <p className="text-[13px] text-ink font-[450] leading-snug">Electrical conflict detected</p>
              <p className="text-[12px] text-graphite mt-0.5 leading-snug">Sheet A-101 · Rev 4</p>
              <p className="text-[12px] text-graphite mt-0.5">New outlet overlaps with plumbing riser — 65% conflict probability</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dove/10">
            <div className="flex -space-x-1.5">
              {['SC', 'MT', 'JW'].map((init, i) => (
                <div key={init} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-[500] text-ink border border-white ${i === 0 ? 'bg-[#d3e3fc]' : i === 1 ? 'bg-[#fbe1d1]' : 'bg-[#c8e6c9]'}`}>
                  {init}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-graphite">3 need to review</span>
            <span className="ml-auto text-[11px] text-rust font-[430]">2 min ago</span>
          </div>
        </Card>
      </div>
    </section>
  )
}
