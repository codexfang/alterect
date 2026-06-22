import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  GitBranch, Bell, BarChart3, Shield, Upload, Eye,
  CheckCircle, Layers, MessageSquare, FileText,
  ChevronRight, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import HeroSection from '@/components/hero/HeroSection'
import WaitlistModal from '@/components/ui/WaitlistModal'

const features = [
  { icon: Upload, title: 'Auto-Ingestion', desc: 'Watch folders, email attachments, Dropbox, Box, and Procore. New revisions are detected and versioned automatically.', color: 'cool' as const },
  { icon: GitBranch, title: 'Smart Diff Engine', desc: 'Every change detected — walls moved, outlets added, notes modified. Classified by trade with severity scores and visual highlights.', color: 'cool' as const },
  { icon: Bell, title: 'Trade-Specific Alerts', desc: 'Subcontractors only get notified about changes that affect their trade. Slack, email, or in-app with highlighted thumbnails.', color: 'warm' as const },
  { icon: BarChart3, title: 'Impact & Risk Scoring', desc: 'ML predicts rework cost, conflict probability, and suggests actions before problems arise. Score 0-100 with color-coded severity.', color: 'warm' as const },
  { icon: MessageSquare, title: 'Natural Language Query', desc: '"Show me all electrical changes on floor 2" — AI retrieves relevant diffs and highlights them on the drawing preview.', color: 'cool' as const },
  { icon: Layers, title: 'Visual Timeline', desc: 'Full version history for every sheet. Click any revision to see the diff. Rollback simulation: "What did this look like at Rev 9?"', color: 'cool' as const },
]

const steps = [
  { number: '01', title: 'Connect your sources', desc: 'Link Dropbox, Box, or Procore. Alterect watches for new revisions and parses filenames automatically.', icon: Upload },
  { number: '02', title: 'Analyzing change', desc: 'Vision AI compares old vs new drawings — detecting moved walls, added outlets, modified notes, and dimension changes.', icon: Eye },
  { number: '03', title: 'Trades alerted instantly', desc: 'Only the subs who need to know get notified with a highlighted thumbnail of exactly what changed.', icon: Bell },
  { number: '04', title: 'Review, act, and track', desc: 'Risk scores, conflict predictions, and suggested actions. A visual timeline shows who changed what and when and why.', icon: CheckCircle },
]

const pricingPlans = [
  {
    name: 'Starter', price: 'Coming soon', period: '', desc: 'For small teams getting started', features: ['1 project', '50 drawings/month', 'Basic diff detection', 'Email alerts', 'Manual upload', '7-day drawing history'],
    cta: 'Join waitlist', popular: false,
  },
  {
    name: 'Professional', price: 'Coming soon', period: '', desc: 'For GCs and subcontractors', features: ['Unlimited drawings', 'AI-powered diff engine', 'Auto-ingestion (Dropbox, Box)', 'Slack + email alerts', 'Risk scoring', 'Visual timeline', 'Priority support'],
    cta: 'Join waitlist', popular: false,
  },
  {
    name: 'Enterprise', price: 'Coming soon', period: '', desc: 'For growing construction firms', features: ['Up to 5 projects', 'All Professional features', 'Team collaboration', 'Custom Slack channels', 'Advanced analytics', 'API access', 'Dedicated support'],
    cta: 'Join waitlist', popular: false,
  },
]

const faqs = [
  { q: 'How does Alterect detect changes in my drawings?', a: 'Alterect uses computer vision AI to compare every new upload against all past revisions — detecting moved walls, added outlets, modified notes, and dimension changes. Each change is classified by trade and severity.' },
  { q: 'Which file formats do you support?', a: 'PDF, DWF, and common raster formats are supported. Drawings are processed at original resolution for pixel-perfect diff detection. Native DWG support is on the roadmap.' },
  { q: 'Can I integrate with Procore, Dropbox, or BIM 360?', a: 'Yes. Alterect connects directly with Dropbox, Box, Procore, and BIM 360. New drawings uploaded to connected folders are automatically ingested, versioned, and diffed with zero manual steps.' },
  { q: 'How are my drawings secured?', a: 'Alterect is SOC 2 compliant. All drawings are encrypted at rest (AES-256) and in transit (TLS 1.3). Multi-tenant data is isolated, and on-premise deployment is available for enterprise customers.' },
  { q: 'What happens when a conflict is detected?', a: 'Alterect assigns a conflict probability score (0–100) and flags the affected trades. Notifications go out via Slack, email, or in-app with a side-by-side diff showing exactly what changed and where.' },
  { q: 'Do you offer a free trial?', a: 'Yes. The Starter plan includes a 7-day free trial — enter your billing info to start, and you will not be charged until the trial ends. Cancel anytime before the 7 days are up and you will not pay a cent.' },
  { q: 'How fast are new drawings processed?', a: 'Most drawings are processed in under 60 seconds. Complex sheets with dense annotations may take a few minutes. You will receive an alert the moment the diff analysis is complete.' },
]

const footerLinks = {
  Product: [{ label: 'Overview', href: '/#how-it-works' }, { label: 'Workflow', href: '/#workflow' }, { label: 'Features', href: '/#features' }, { label: 'Pricing', href: '/#pricing' }],
  Solutions: [{ label: 'Contractors' }, { label: 'Design Teams' }, { label: 'Project Owners' }, { label: 'BIM Managers' }],
  Platform: [{ label: 'Smart Diff Engine' }, { label: 'Language Query' }, { label: 'Trade Alerts' }, { label: 'Risk Scoring' }],
  Resources: [{ label: 'Documentation' }, { label: 'Help Center' }, { label: 'Community' }, { label: 'Webinars' }],
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] } }),
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section ref={ref} id={id} initial="hidden" animate={isInView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.section>
  )
}

const sectionMap: Record<string, string> = {
  '/overview': 'how-it-works',
  '/workflow': 'workflow',
  '/features': 'features',
  '/pricing': 'pricing',
  '/resources': 'resources',
}

export default function Landing() {
  const navigate = useNavigate()
  const location = useLocation()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showWaitlist, setShowWaitlist] = useState(false)

  useEffect(() => {
    const id = sectionMap[location.pathname]
    if (id) {
      // small delay to let the DOM render
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timer)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname])
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-dove/10"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate('/') }}
            className="flex items-center gap-3"
          >
            <img src={`${import.meta.env.BASE_URL}AlterectLogo.png`} alt="Alterect" className="h-9 w-auto relative -top-[6px]" />
            <span className="font-serif text-heading-sm text-ink">Alterect</span>
          </a>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Overview', to: '/overview', id: 'how-it-works' },
              { label: 'Workflow', to: '/workflow', id: 'workflow' },
              { label: 'Features', to: '/features', id: 'features' },
              { label: 'Pricing', to: '/pricing', id: 'pricing' },
              { label: 'Resources', to: '/resources', id: 'resources' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (location.pathname === item.to) {
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    navigate(item.to)
                  }
                }}
                className={`px-3 py-2 text-body transition-colors rounded-xl hover:bg-fog ${location.pathname === item.to ? 'text-rust' : 'text-ink hover:text-rust'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setShowWaitlist(true)}>Join waitlist</Button>
          </div>
        </div>
      </motion.nav>

      {/* ─── HERO ─── */}
      <HeroSection onJoinWaitlist={() => setShowWaitlist(true)} />

      {/* ─── HOW IT WORKS ─── */}

      {/* ─── HOW IT WORKS ─── */}
      <Section id="how-it-works" className="py-28 bg-fog relative">
        <div className="radial-glow-left absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-20">
            <span className="text-caption text-rust font-[450] uppercase tracking-widest">Overview</span>
            <h2 className="font-serif text-heading-sm text-ink mt-3 mx-auto">
              From upload to alert in under 60 seconds
            </h2>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.number} variants={scaleIn} className="relative group">
                <Card padding="lg" hover className="h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[48px] font-serif text-dove/40 group-hover:text-rust/30 transition-colors duration-500 leading-none">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 bg-fog rounded-2xl flex items-center justify-center group-hover:bg-apricot-wash transition-colors duration-300">
                      <step.icon size={18} strokeWidth={1.5} className="text-graphite group-hover:text-rust transition-colors duration-300" />
                    </div>
                  </div>
                  <h3 className="text-subheading text-ink mb-2">{step.title}</h3>
                  <p className="text-body text-graphite leading-relaxed">{step.desc}</p>
                </Card>
                  {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -translate-y-1/2 z-20 text-ink/25"
                    style={{ right: '-20px' }}
                  >
                    <ChevronRight size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ─── WORKFLOW DEMO ─── */}
      <Section id="workflow" className="py-28 relative overflow-hidden">
        <div className="radial-glow-right absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <span className="text-caption text-rust font-[450] uppercase tracking-widest">Demo</span>
              <h2 className="font-serif text-heading text-ink mt-3 max-w-3xl mx-auto" id="demo">
                See exactly what changed
              </h2>
            </motion.div>
          </div>

          {/* Interactive Demo Card */}
          <motion.div variants={scaleIn}>
            <Card padding="none" className="overflow-hidden max-w-5xl mx-auto shadow-card">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 bg-fog border-b border-dove/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rust/40" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]/40" />
                  <div className="w-3 h-3 rounded-full bg-green-500/40" />
                </div>
                <div className="flex-1 max-w-md mx-auto bg-white rounded-lg px-3 py-1.5 text-[12px] text-graphite text-center border border-dove/10 font-[450]">
                  alterect.com/projects/harbor-tower/diff
                </div>
                <div className="flex items-center gap-1 text-[11px] text-graphite">
                  <div className="w-6 h-6 rounded-lg bg-white border border-dove/10 flex items-center justify-center">
                    <ChevronRight size={12} className="-rotate-90" />
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-white border border-dove/10 flex items-center justify-center">
                    <ChevronRight size={12} className="rotate-90" />
                  </div>
                </div>
              </div>

              {/* Demo content — diff viewer simulation */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-apricot-wash/50 rounded-xl flex items-center justify-center">
                      <FileText size={15} className="text-rust" />
                    </div>
                    <div>
                      <span className="text-sm font-[450] text-ink">A-101 Floor Plan</span>
                      <span className="text-[12px] text-graphite ml-2">Rev 3 vs Rev 4</span>
                    </div>
                    <span className="px-2.5 py-0.5 text-[11px] bg-rust/10 text-rust rounded-full font-[430]">6 changes</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="px-3 py-1 text-[11px] bg-rust/10 text-rust rounded-lg font-[430]">Side by side</span>
                    <span className="px-3 py-1 text-[11px] text-graphite rounded-lg">Overlay</span>
                  </div>
                </div>

                {/* Two-column diff viewer */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Old drawing */}
                  <div className="bg-fog rounded-xl p-4 border border-dove/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] text-graphite font-[430]">Previous (Rev 3)</span>
                      <span className="text-[11px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-[430]">3 removed</span>
                    </div>
                    <div className="aspect-[4/3] bg-white rounded-lg relative overflow-hidden">
                      <svg viewBox="0 0 400 300" className="w-full h-full">
                        <rect x="30" y="30" width="340" height="240" rx="3" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                        <rect x="50" y="50" width="110" height="180" rx="2" fill="none" stroke="#d3e3fc" strokeWidth="1.5" />
                        <rect x="55" y="65" width="25" height="25" rx="1" fill="none" stroke="#d3e3fc" strokeWidth="0.5" />
                        <rect x="55" y="95" width="40" height="15" rx="1" fill="none" stroke="#d3e3fc" strokeWidth="0.5" />
                        <rect x="160" y="50" width="80" height="120" rx="2" fill="none" stroke="#fbe1d1" strokeWidth="1.5" />
                        <rect x="165" y="60" width="15" height="15" rx="1" fill="#fbe1d1" opacity="0.4" />
                        <rect x="165" y="80" width="15" height="15" rx="1" fill="#fbe1d1" opacity="0.4" />
                        <circle cx="200" cy="190" r="4" fill="#a3a6af" />
                        <rect x="280" y="60" width="25" height="12" rx="2" fill="#d3e3fc" />
                        <rect x="280" y="80" width="25" height="12" rx="2" fill="#d3e3fc" />
                        <text x="300" y="70" fontSize="6" fill="#a3a6af">W.C.</text>
                        <rect x="50" y="250" width="80" height="12" rx="1" fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3" />
                        {/* Removed highlights */}
                        <rect x="45" y="45" width="120" height="192" rx="3" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" className="opacity-70" />
                        <rect x="155" y="45" width="92" height="132" rx="3" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" className="opacity-70" />
                        <rect x="45" y="245" width="92" height="22" rx="2" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4" className="opacity-70" />
                      </svg>
                      <div className="absolute top-[16%] left-[34%] -translate-x-1/2">
                        <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded text-[9px] text-red-600 font-[430] border border-red-200 whitespace-nowrap">
                          <span>Wall moved</span>
                        </div>
                      </div>
                      <div className="absolute top-[40%] left-[60%]">
                        <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded text-[9px] text-red-600 font-[430] border border-red-200 whitespace-nowrap">
                          <span>Partition removed</span>
                        </div>
                      </div>
                      <div className="absolute bottom-[18%] left-[12%]">
                        <div className="flex items-center gap-1 bg-orange-50 px-1.5 py-0.5 rounded text-[9px] text-orange-600 font-[430] border border-orange-200 whitespace-nowrap">
                          <span>Wall removed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New drawing */}
                  <div className="bg-fog rounded-xl p-4 border border-dove/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] text-graphite font-[430]">Current (Rev 4)</span>
                      <span className="text-[11px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-[430]">3 added</span>
                    </div>
                    <div className="aspect-[4/3] bg-white rounded-lg relative overflow-hidden">
                      <svg viewBox="0 0 400 300" className="w-full h-full">
                        <rect x="30" y="30" width="340" height="240" rx="3" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                        <rect x="70" y="50" width="90" height="180" rx="2" fill="none" stroke="#5d2a1a" strokeWidth="1.5" strokeDasharray="4" />
                        <rect x="75" y="65" width="25" height="25" rx="1" fill="none" stroke="#5d2a1a" strokeWidth="0.5" />
                        <rect x="75" y="95" width="40" height="15" rx="1" fill="none" stroke="#5d2a1a" strokeWidth="0.5" />
                        <rect x="230" y="50" width="70" height="100" rx="2" fill="none" stroke="#5d2a1a" strokeWidth="1" />
                        <rect x="235" y="60" width="15" height="15" rx="1" fill="#5d2a1a" opacity="0.15" />
                        <rect x="235" y="80" width="15" height="15" rx="1" fill="#5d2a1a" opacity="0.15" />
                        <text x="248" y="142" fontSize="5" fill="#5d2a1a" fontWeight="bold">STORAGE</text>
                        <circle cx="200" cy="190" r="4" fill="#a3a6af" />
                        <circle cx="220" cy="190" r="4" fill="#5d2a1a" />
                        <rect x="280" y="60" width="25" height="12" rx="2" fill="#d3e3fc" />
                        <rect x="280" y="80" width="25" height="12" rx="2" fill="#d3e3fc" />
                        <rect x="280" y="100" width="40" height="15" rx="2" fill="none" stroke="#5d2a1a" strokeWidth="0.5" />
                        <text x="285" y="112" fontSize="5" fill="#5d2a1a">UTILITY</text>
                        <rect x="50" y="250" width="80" height="12" rx="1" fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3" />
                        {/* Added highlights */}
                        <rect x="65" y="45" width="100" height="192" rx="3" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" className="opacity-70" />
                        <rect x="225" y="45" width="82" height="110" rx="3" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" className="opacity-70" />
                      </svg>
                      <div className="absolute top-[16%] left-[36%] -translate-x-1/2">
                        <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[9px] text-green-600 font-[430] border border-green-200 whitespace-nowrap">
                          <span>Wall relocated</span>
                        </div>
                      </div>
                      <div className="absolute top-[46%] left-[70%]">
                        <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[9px] text-green-600 font-[430] border border-green-200 whitespace-nowrap">
                          <span>Storage added</span>
                        </div>
                      </div>
                      <div className="absolute bottom-[5%] right-[6%]">
                        <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[9px] text-green-600 font-[430] border border-green-200 whitespace-nowrap">
                          <span>Utility added</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change list footer */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { type: 'Wall relocated 18" east', trade: 'Structural', severity: 'High', badge: 'bg-rust/10 text-rust', dot: 'bg-rust' },
                    { type: 'Storage room added', trade: 'Architectural', severity: 'Low', badge: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
                    { type: 'Utility closet added', trade: 'MEP', severity: 'Low', badge: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-dove/10">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-ink font-[450] truncate">{item.type}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-[430] shrink-0 ${item.badge}`}>{item.severity}</span>
                        </div>
                        <span className="text-[11px] text-graphite">{item.trade}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Version timeline dots */}
                <div className="mt-5 pt-4 border-t border-dove/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {['Rev 1', 'Rev 2', 'Rev 3', 'Rev 4'].map((rev, i) => (
                      <div key={rev} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${i === 3 ? 'bg-rust' : i === 2 ? 'bg-rust/40' : 'bg-dove/30'}`} />
                        <span className={`text-[11px] ${i === 3 ? 'text-ink font-[450]' : 'text-graphite'}`}>{rev}</span>
                        {i < 3 && <div className="w-4 h-px bg-dove/20" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-rust font-[430] cursor-pointer hover:text-rust/70 transition-colors">
                    <Eye size={13} />
                    <span>View full timeline</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </Section>





      {/* ─── FEATURES ─── */}
      <Section id="features" className="py-28 bg-fog">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-caption text-rust font-[450] uppercase tracking-widest">Features</span>
            <h2 className="font-serif text-heading text-ink mt-3 max-w-3xl mx-auto">
              Everything you need to stay on the same drawing
            </h2>
          </motion.div>

          <motion.div variants={stagger} className="space-y-6">
            {[0, 1, 2].map((row) => {
              const leftBig = row % 2 === 0
              const left = features[row * 2]
              const right = features[row * 2 + 1]
              return (
                <motion.div key={row} variants={scaleIn}>
                  <div className="flex gap-6">
                    <div className={`rounded-[24px] shadow-subtle bg-white group hover:shadow-[rgba(4,23,43,0.08)_0px_0px_0px_1px,rgba(0,0,0,0.15)_0px_20px_25px_-5px,rgba(0,0,0,0.12)_0px_8px_10px_-6px] transition-all duration-300 ${leftBig ? 'w-[62%]' : 'w-[38%]'}`}>
                      <div className="relative overflow-hidden rounded-[24px]">
                        {leftBig && (
                          <div
                            className="absolute inset-0 z-0"
                            style={{
                              clipPath: 'polygon(55% 0%, 100% 0%, 100% 100%, 75% 100%)',
                              backgroundColor: left.color === 'warm' ? '#fbe1d1' : '#d3e3fc',
                              opacity: 0.15,
                            }}
                          />
                        )}
                        <div className="relative z-10 p-6">
                          <div className="w-10 h-10 bg-fog rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <left.icon size={20} strokeWidth={1.5} className="text-ink" />
                          </div>
                          <h3 className="text-subheading text-ink mb-1.5">{left.title}</h3>
                          <p className="text-body text-graphite leading-relaxed">{left.desc}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-[24px] shadow-subtle bg-white group hover:shadow-[rgba(4,23,43,0.08)_0px_0px_0px_1px,rgba(0,0,0,0.15)_0px_20px_25px_-5px,rgba(0,0,0,0.12)_0px_8px_10px_-6px] transition-all duration-300 ${!leftBig ? 'w-[62%]' : 'w-[38%]'}`}>
                      <div className="relative overflow-hidden rounded-[24px]">
                        {!leftBig && (
                          <div
                            className="absolute inset-0 z-0"
                            style={{
                              clipPath: 'polygon(45% 0%, 100% 0%, 100% 100%, 25% 100%)',
                              backgroundColor: right.color === 'warm' ? '#fbe1d1' : '#d3e3fc',
                              opacity: 0.15,
                            }}
                          />
                        )}
                        <div className="relative z-10 p-6">
                          <div className="w-10 h-10 bg-fog rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <right.icon size={20} strokeWidth={1.5} className="text-ink" />
                          </div>
                          <h3 className="text-subheading text-ink mb-1.5">{right.title}</h3>
                          <p className="text-body text-graphite leading-relaxed">{right.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Section>


      {/* ─── PRICING ─── */}
      <Section id="pricing" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-caption text-rust font-[450] uppercase tracking-widest">Pricing</span>
            <h2 className="font-serif text-heading text-ink mt-3">Simple costs</h2>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div key={plan.name} variants={scaleIn} className="relative">
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-rust text-white text-[11px] font-[450] rounded-full">
                    Most popular
                  </div>
                )}
                <Card padding="lg" className={`h-full flex flex-col ${plan.popular ? 'ring-1 ring-rust/30' : ''}`}>
                  <div>
                    <h3 className="text-subheading text-ink">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-serif text-[44px] text-ink tracking-[-0.66px]">{plan.price}</span>
                      {plan.period && <span className="text-caption text-graphite">{plan.period}</span>}
                    </div>
                    <p className="text-caption text-graphite mt-1">{plan.desc}</p>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle size={14} className="text-rust mt-0.5 shrink-0" />
                        <span className="text-body text-ash">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Button variant={plan.popular ? 'primary' : 'secondary'} className="w-full" onClick={() => setShowWaitlist(true)}>
                      {plan.cta}
                      <ArrowRight size={16} className="ml-1.5" />
                    </Button>
                    <p className="text-[11px] text-graphite text-center mt-2">Stay tuned — we're launching soon</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      <WaitlistModal open={showWaitlist} onClose={() => setShowWaitlist(false)} />

      {/* ─── RESOURCES / FAQ ─── */}
      <Section id="resources" className="py-28 bg-fog">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-caption text-rust font-[450] uppercase tracking-widest">Resources</span>
            <h2 className="font-serif text-heading text-ink mt-3">Frequently asked questions</h2>
          </motion.div>

          <motion.div variants={stagger} className="space-y-3">
            {faqs.map((faq, i) => {
              const open = openFaq === i
              return (
                <motion.div key={i} variants={scaleIn}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-dove/10">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-fog/50 transition-colors"
                    >
                      <span className="text-body text-ink font-[450] pr-4">{faq.q}</span>
                      <ChevronRight
                        size={16}
                        className={`text-graphite shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <p className="px-6 pb-5 text-body text-graphite leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-dove/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
            <div className="md:col-span-2">
              <span className="font-serif text-[22px] text-ink tracking-[-0.2px]">Alterect</span>
              <p className="mt-3 text-[14px] text-graphite leading-relaxed max-w-xs">
                Version control for construction drawings.
                Automatically detect every change, alert affected trades,
                and predict rework costs.
              </p>
              <div className="flex gap-3 mt-6">
                {[
                  { icon: () => (
                    <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14}>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  ), label: 'Instagram', href: 'https://instagram.com/alterect' },
                  { icon: () => (
                    <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14}>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ), label: 'Twitter', href: 'https://twitter.com/alterect' },
                  { icon: () => (
                    <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14}>
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  ), label: 'LinkedIn', href: 'https://linkedin.com/company/alterect' },
                  { icon: () => <Mail size={14} />, label: 'Email', href: 'mailto:hello@alterect.com' },
                ].map((item, i) => (
                  <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-fog flex items-center justify-center hover:bg-fog/80 transition-colors" aria-label={item.label}>
                    <item.icon />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(footerLinks).map(([group, items]) => (
              <div key={group}>
                <h4 className="text-[13px] font-[450] text-ink uppercase tracking-wider mb-4">{group}</h4>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item.label}>
                      {'href' in item
                        ? <a href={item.href} className="text-[14px] text-graphite hover:text-ink transition-colors">{item.label}</a>
                        : <span className="text-[14px] text-graphite">{item.label}</span>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-dove/10">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-[13px] text-graphite">
              <span>&copy; 2026 Alterect</span>
              <span className="w-1 h-1 bg-dove/40 rounded-full" />
              <span>hello@alterect.com</span>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-graphite">
              <a href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</a>
              <span className="w-1 h-1 bg-dove/40 rounded-full" />
              <a href="/terms" className="hover:text-ink transition-colors">Terms of Service</a>
              <span className="w-1 h-1 bg-dove/40 rounded-full" />
              <a href="/cookies" className="hover:text-ink transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
