import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Search, FileText, Loader2, ExternalLink, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { storage } from '@/lib/db'
import { backendApi } from '@/lib/backendApi'
import type { Drawing } from '@/lib/db'

export default function Drawings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [drawingList, setDrawingList] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) loadDrawings()
  }, [user])

  const loadDrawings = async () => {
    setLoading(true)
    try {
      if (user) {
        const list = await backendApi.listDrawings(user.id)
        setDrawingList(list)
      }
    } catch (e) {
      console.error('Failed to load drawings:', e)
    }
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setUploadError('')

    try {
      await backendApi.uploadDrawing(file, user.id)
      await loadDrawings()
    } catch (e: any) {
      setUploadError(e.message)
      console.error('Upload failed:', e.message)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const filtered = drawingList.filter((d) =>
    d.sheet_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-ink">Drawings</h1>
          <p className="text-body text-graphite mt-1">
            {drawingList.length > 0
              ? `${drawingList.length} drawing${drawingList.length !== 1 ? 's' : ''} uploaded`
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
              placeholder="Search drawings..."
              className="w-56 pl-9 pr-4 py-2 bg-white rounded-[12px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all border border-dove/10"
            />
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
              {search ? 'No matching drawings' : 'No drawings yet'}
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
                <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Discipline</th>
                <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Revision</th>
                <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Uploaded</th>
                <th className="text-right text-caption text-graphite font-[430] px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-dove/10 last:border-0 hover:bg-fog/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-fog rounded-lg flex items-center justify-center">
                        <FileText size={14} className="text-graphite" />
                      </div>
                      <span className="text-body text-ink font-[450]">{d.sheet_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-body text-graphite capitalize">
                      {d.discipline ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-body text-ink">Rev {d.current_revision}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-body text-graphite">
                      {new Date(d.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {d.file_url && (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-body text-rust hover:text-rust/80 transition-colors"
                        >
                          Open
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => navigate(`/diffs/${d.id}`)}
                        className="inline-flex items-center gap-1 text-body text-graphite hover:text-ink transition-colors"
                      >
                        <GitCompare size={14} />
                        Compare
                      </button>
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
