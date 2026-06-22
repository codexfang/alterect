import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GitCompare, Loader2, ArrowRight, FileText, AlertTriangle, CheckCircle, Plus, Minus, Pencil, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { revisions, drawings } from '@/lib/db'
import { backendApi } from '@/lib/backendApi'
import type { Revision, Drawing } from '@/lib/db'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://alterect-api.onrender.com'

interface DiffRegion {
  x: number; y: number; w: number; h: number
  area: number
  area_percentage: number
  change_type: 'added' | 'removed' | 'modified'
}

interface DiffResult {
  change_count: number
  change_percentage: number
  regions: DiffRegion[]
  overlay_url: string | null
}

export default function DiffView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [revs, setRevs] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedPrev, setSelectedPrev] = useState<string>('')
  const [selectedCurr, setSelectedCurr] = useState<string>('')
  const [diffing, setDiffing] = useState(false)
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [error, setError] = useState('')
  const [alertGenerated, setAlertGenerated] = useState(false)
  const [riskResult, setRiskResult] = useState<{
    score: number
    level: string
    color: string
    factors: { name: string; score: number; weight: number; detail: string }[]
    recommendation: string
  } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!id) return
    loadDrawing()
  }, [id])

  const loadDrawing = async () => {
    setLoading(true)
    const d = await drawings.get(id!)
    setDrawing(d)
    if (d) {
      const r = await revisions.listForDrawing(d.id)
      // r comes back revision_number.desc (newest first)
      setRevs(r)
      if (r.length >= 2) {
        // Previous = newest (most recent), Current = second newest
        setSelectedPrev(r[0].id)
        setSelectedCurr(r[1].id)
      }
    }
    setLoading(false)
  }

  const handleCompare = async () => {
    if (!selectedPrev || !selectedCurr) return
    setDiffing(true)
    setError('')
    setDiffResult(null)

    const prev = revs.find((r) => r.id === selectedPrev)
    const curr = revs.find((r) => r.id === selectedCurr)
    if (!prev || !curr) return

    try {
      const res = await fetch(`${BACKEND_URL}/api/diff/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previous_url: prev.file_url, current_url: curr.file_url }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Comparison failed')
      }
      const data: DiffResult = await res.json()
      setDiffResult(data)
      setAlertGenerated(false)

      // Auto-generate alerts + risk score from this comparison
      if (user && drawing) {
        try {
          const projectName = drawing.project_id
            ? await backendApi.listProjects(user.id).then((projects) => {
                const p = projects.find((pr: any) => pr.id === drawing.project_id)
                return p?.name || drawing.sheet_name || 'Untitled'
              }).catch(() => drawing.sheet_name || 'Untitled')
            : drawing.sheet_name || 'Untitled'

          // Generate alerts
          await backendApi.generateAlerts({
            user_id: user.id,
            drawing_id: drawing.id,
            sheet_name: drawing.sheet_name || 'Untitled',
            project_id: drawing.project_id || '',
            project_name: projectName,
            discipline: (drawing as any).discipline || '',
            from_revision_number: prev.revision_number,
            to_revision_number: curr.revision_number,
            change_count: data.change_count,
            change_percentage: data.change_percentage,
          })
          setAlertGenerated(true)

          // Compute risk score
          const risk = await backendApi.scoreRisk({
            drawing_id: drawing.id,
            user_id: user.id,
            sheet_name: drawing.sheet_name || 'Untitled',
            project_id: drawing.project_id || '',
            project_name: projectName,
            discipline: (drawing as any).discipline || '',
            from_revision_number: prev.revision_number,
            to_revision_number: curr.revision_number,
            change_count: data.change_count,
            change_percentage: data.change_percentage,
            regions: data.regions.map((r) => ({
              change_type: r.change_type,
              area_percentage: r.area_percentage,
            })),
          })
          setRiskResult(risk)
        } catch (alertErr) {
          console.warn('Alert/risk generation failed (non-fatal):', alertErr)
        }
      }
    } catch (e: any) {
      setError(e.message)
    }
    setDiffing(false)
  }

  if (initialLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="text-graphite animate-spin" />
      </div>
    )
  }

  if (!id) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-heading-sm text-ink">Diff Viewer</h1>
          <p className="text-body text-graphite mt-1">Compare drawing revisions side by side.</p>
        </div>
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mb-4">
              <GitCompare size={24} className="text-graphite" />
            </div>
            <h3 className="text-subheading text-ink mb-1">Select a drawing</h3>
            <p className="text-body text-graphite mb-6 max-w-sm text-center">
              Go to Drawings and click "Compare" on a drawing to see revision differences.
            </p>
            <Button onClick={() => navigate('/drawings')}>Go to Drawings</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="text-graphite animate-spin" />
      </div>
    )
  }

  if (!drawing) {
    return (
      <div className="p-6 space-y-6">
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle size={24} className="text-graphite mb-4" />
            <h3 className="text-subheading text-ink">Drawing not found</h3>
            <Button className="mt-4" onClick={() => navigate('/drawings')}>Back to Drawings</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-ink">{drawing.sheet_name}</h1>
          <p className="text-body text-graphite mt-1">Compare revisions</p>
        </div>
      </div>

      {/* Revision selector */}
      <Card padding="md">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="text-caption text-graphite font-[430] block mb-1">Previous revision</label>
            <select
              value={selectedPrev}
              onChange={(e) => setSelectedPrev(e.target.value)}
              className="px-3 py-2 bg-white rounded-[12px] text-body text-ink border border-dove/20 focus:outline-none focus:ring-2 focus:ring-ink/10"
            >
              {revs.map((r) => (
                <option key={r.id} value={r.id}>
                  Rev {r.revision_number} — {r.notes || new Date(r.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <ArrowRight size={20} className="text-graphite mb-2" />
          <div>
            <label className="text-caption text-graphite font-[430] block mb-1">Current revision</label>
            <select
              value={selectedCurr}
              onChange={(e) => setSelectedCurr(e.target.value)}
              className="px-3 py-2 bg-white rounded-[12px] text-body text-ink border border-dove/20 focus:outline-none focus:ring-2 focus:ring-ink/10"
            >
              {revs.map((r) => (
                <option key={r.id} value={r.id}>
                  Rev {r.revision_number} — {r.notes || new Date(r.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCompare} disabled={diffing || !selectedPrev || !selectedCurr}>
            {diffing ? (
              <Loader2 size={16} className="mr-1.5 animate-spin" />
            ) : (
              <GitCompare size={16} className="mr-1.5" />
            )}
            {diffing ? 'Comparing...' : 'Compare'}
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card padding="md" variant="warm">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={16} />
            <span className="text-body">Comparison failed: {error}</span>
          </div>
        </Card>
      )}

      {/* Diff results */}
      {diffResult && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card padding="md">
              <p className="text-caption text-graphite font-[430]">Changes detected</p>
              <p className="font-serif text-[32px] text-ink mt-1">{diffResult.change_count}</p>
            </Card>
            <Card padding="md">
              <p className="text-caption text-graphite font-[430]">Area changed</p>
              <p className="font-serif text-[32px] text-ink mt-1">{diffResult.change_percentage}%</p>
            </Card>
            <Card padding="md">
              <p className="text-caption text-graphite font-[430]">Risk score</p>
              {riskResult ? (
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: riskResult.color }}
                  />
                  <p className="font-serif text-[32px] text-ink" style={{ color: riskResult.color }}>
                    {riskResult.score}
                  </p>
                  <span
                    className="font-serif text-[16px] mt-3"
                    style={{ color: riskResult.color }}
                  >
                    /100
                  </span>
                </div>
              ) : (
                <p className="font-serif text-[32px] text-graphite/40 mt-1">—</p>
              )}
            </Card>
          </div>

          {/* Diff overlay image */}
          {diffResult.overlay_url && (
            <Card padding="md">
              <h3 className="text-subheading text-ink mb-3">Changes highlighted</h3>
              <div className="bg-fog rounded-xl p-2 border border-dove/10">
                <img
                  src={diffResult.overlay_url}
                  alt="Diff overlay"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </Card>
          )}

          {/* Change regions list */}
          {diffResult.regions.length > 0 && (
            <Card padding="md">
              <h3 className="text-subheading text-ink mb-3">Changed regions</h3>
              <div className="space-y-2">
                {diffResult.regions.map((r, i) => {
                  const typeMeta = r.change_type === 'added'
                    ? { icon: Plus, color: 'text-green-600', bg: 'bg-green-50', label: 'Added' }
                    : r.change_type === 'removed'
                    ? { icon: Minus, color: 'text-red-600', bg: 'bg-red-50', label: 'Removed' }
                    : { icon: Pencil, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Modified' }
                  const Icon = typeMeta.icon
                  return (
                    <div key={i} className={`flex items-center gap-3 text-body text-graphite ${typeMeta.bg} rounded-xl px-4 py-3`}>
                      <Icon size={14} className={`${typeMeta.color} shrink-0`} />
                      <div className="flex-1 flex items-center justify-between">
                        <span>
                          <span className={`font-[500] ${typeMeta.color}`}>{typeMeta.label}</span>
                          {' '}— ({r.x}, {r.y}) {r.w}×{r.h}px
                        </span>
                        <span className="text-caption text-graphite">{r.area_percentage}% of drawing</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Risk breakdown */}
          {riskResult && (
            <Card padding="md">
              <h3 className="text-subheading text-ink mb-3">Risk breakdown</h3>
              <div className="space-y-2">
                {riskResult.factors.map((f, i) => {
                  const pct = f.weight > 0 ? Math.round((f.score / f.weight) * 100) : 0
                  const barColor = pct >= 70 ? '#DC2626' : pct >= 40 ? '#EA580C' : '#16A34A'
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-body text-graphite mb-1">
                        <span className="font-[450]">{f.name}</span>
                        <span>{f.score}/{f.weight}</span>
                      </div>
                      <div className="w-full h-1.5 bg-fog rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <p className="text-caption text-graphite mt-0.5">{f.detail}</p>
                    </div>
                  )
                })}
              </div>
              {riskResult.recommendation && (
                <div className="mt-3 pt-3 border-t border-dove/10">
                  <p className="text-caption text-graphite font-[430] mb-1">Recommendation</p>
                  <p className="text-body text-ink">{riskResult.recommendation}</p>
                </div>
              )}
            </Card>
          )}

          {/* Alert generated indicator */}
          {alertGenerated && (
            <Card padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700">
                  <Bell size={16} />
                  <span className="text-body">Alert generated for affected trades</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate('/alerts')}>
                  View Alerts
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Revision history */}
      <Card padding="md">
        <h3 className="text-subheading text-ink mb-3">Revision history</h3>
        <div className="space-y-2">
          {revs.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-fog rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <FileText size={14} className="text-graphite" />
                </div>
                <div>
                  <p className="text-body text-ink font-[450]">Rev {r.revision_number}</p>
                  <p className="text-caption text-graphite">{r.notes || new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-body text-rust hover:text-rust/80">
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
