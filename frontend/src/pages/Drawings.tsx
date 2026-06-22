import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Search, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { backendApi } from '@/lib/backendApi'

const DISCIPLINES = [
  { value: '', label: 'Auto-detect' },
  { value: 'architectural', label: 'Architectural' },
  { value: 'structural', label: 'Structural' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'civil', label: 'Civil' },
  { value: 'other', label: 'Other' },
]

export default function Drawings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [drawingId, setDrawingId] = useState<string | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) loadItems()
  }, [user])

  const loadItems = async () => {
    setLoading(true)
    try {
      if (!user) return
      const drawings = await backendApi.listDrawings(user.id)
      if (drawings.length > 0) {
        const d = drawings[0]
        setDrawingId(d.id)
        setSheetName(d.sheet_name)
        const revs = await backendApi.listAllRevisions(user.id)
        setItems(revs)
      } else {
        setItems([])
      }
    } catch (e) {
      console.error('Failed to load:', e)
    }
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setUploadError('')

    try {
      const result = await backendApi.uploadDrawing(file, user.id, discipline)
      setSheetName(result.drawing.sheet_name)
      setDrawingId(result.drawing.id)
      await loadItems()
    } catch (e: any) {
      setUploadError(e.message)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (drawingId: string) => {
    if (!window.confirm('Delete this drawing and all its revisions?')) return
    if (!user) return

    setDeleting(drawingId)
    try {
      await backendApi.deleteDrawing(drawingId, user.id)
      setDrawingId(null)
      setItems([])
    } catch (e: any) {
      console.error('Delete failed:', e.message)
    }
    setDeleting(null)
  }

  const filtered = items.filter((r) =>
    r.revision_number.toString().includes(search) ||
    sheetName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-ink">Drawings</h1>
          <p className="text-body text-graphite mt-1">
            {items.length > 0
              ? `${items.length} upload${items.length !== 1 ? 's' : ''}`
              : 'Upload and manage your drawing sheets.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search revisions..."
              className="w-48 pl-9 pr-4 py-2 bg-white rounded-[12px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all border border-dove/10"
            />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-[12px] border border-dove/10 px-3 py-2">
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="text-body text-ink bg-transparent focus:outline-none cursor-pointer"
            >
              {DISCIPLINES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 size={16} className="mr-1.5 animate-spin" />
            ) : (
              <Upload size={16} className="mr-1.5" />
            )}
            {uploading ? 'Uploading...' : 'Upload Drawing'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.dwg,.dwf,.png,.jpg"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-body text-red-700">
          Upload failed: {uploadError}
        </div>
      )}

      {loading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-graphite animate-spin" />
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mb-4">
              <FileText size={24} className="text-graphite" />
            </div>
            <h3 className="text-subheading text-ink mb-1">
              {search ? 'No matching uploads' : 'No drawings yet'}
            </h3>
            <p className="text-body text-graphite mb-6 max-w-sm text-center">
              {search
                ? 'Try a different search term.'
                : 'Upload your first drawing to start tracking revisions and detecting changes automatically.'}
            </p>
            {!search && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} className="mr-1.5" />
                Upload Drawing
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-[24px] shadow-subtle border border-dove/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dove/10">
                <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Sheet Name</th>
                <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Revision</th>
                <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Uploaded</th>
                <th className="text-right text-caption text-graphite font-[430] px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-dove/10 last:border-0 hover:bg-fog/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-fog rounded-lg flex items-center justify-center">
                        <FileText size={14} className="text-graphite" />
                      </div>
                      <span className="text-body text-ink font-[450]">{sheetName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-body text-ink">Rev {r.revision_number}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-body text-graphite">
                      {new Date(r.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {r.file_url && (
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-body text-rust hover:text-rust/80 transition-colors"
                        >
                          View
                        </a>
                      )}
                      <span className="text-dove/30 text-body font-light select-none">/</span>
                      {drawingId && (
                        <button
                          onClick={() => navigate(`/diffs/${drawingId}`)}
                          className="text-body text-graphite hover:text-ink transition-colors"
                        >
                          Compare
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
