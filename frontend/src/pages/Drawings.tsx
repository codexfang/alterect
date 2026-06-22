import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Search, FileText, Loader2, Folder, FolderPlus, Trash2, ChevronLeft, X } from 'lucide-react'
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
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [drawingId, setDrawingId] = useState<string | null>(null)
  const [revisions, setRevisions] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingRevisions, setLoadingRevisions] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) loadProjects()
  }, [user])

  useEffect(() => {
    if (selectedProject) loadRevisionsForProject(selectedProject.id)
  }, [selectedProject])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      if (user) {
        const list = await backendApi.listProjects(user.id)
        setProjects(list)
        if (!selectedProject && list.length > 0) {
          setSelectedProject(list[0])
        }
      }
    } catch (e) {
      console.error('Failed to load projects:', e)
    }
    setLoadingProjects(false)
  }

  const loadRevisionsForProject = async (projectId: string) => {
    setLoadingRevisions(true)
    setRevisions([])
    setDrawingId(null)
    try {
      const drawings = await backendApi.listDrawings(user!.id)
      const projectDrawing = drawings.find((d: any) => d.project_id === projectId)
      if (projectDrawing) {
        setDrawingId(projectDrawing.id)
        const revs = await backendApi.listRevisions(projectDrawing.id)
        setRevisions(revs)
      }
    } catch (e) {
      console.error('Failed to load revisions:', e)
    }
    setLoadingRevisions(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !selectedProject) return

    setUploading(true)
    setUploadError('')

    try {
      await backendApi.uploadDrawing(file, user.id, discipline, selectedProject.id)
      await loadRevisionsForProject(selectedProject.id)
    } catch (e: any) {
      setUploadError(e.message)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return
    setCreatingFolder(true)
    try {
      const project = await backendApi.createProject(user.id, newFolderName.trim())
      setProjects((prev) => [project, ...prev])
      setSelectedProject(project)
      setShowNewFolder(false)
      setNewFolderName('')
    } catch (e: any) {
      console.error('Failed to create folder:', e)
    }
    setCreatingFolder(false)
  }

  const handleDeleteRevision = async (revisionId: string) => {
    if (!window.confirm('Delete this revision?')) return
    if (!user) return
    try {
      await backendApi.deleteRevision(revisionId, user.id)
      if (selectedProject) await loadRevisionsForProject(selectedProject.id)
    } catch (e: any) {
      console.error('Failed to delete revision:', e)
    }
  }

  const handleDeleteFolder = async (projectId: string) => {
    if (!window.confirm('Delete this folder and all its drawings?')) return
    if (!user) return

    try {
      await backendApi.deleteProject(projectId, user.id)
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      if (selectedProject?.id === projectId) {
        setSelectedProject(projects.length > 1 ? projects.find((p) => p.id !== projectId) : null)
      }
    } catch (e: any) {
      console.error('Failed to delete folder:', e)
    }
  }

  const filteredRevisions = selectedProject
    ? revisions
    : []

  return (
    <div className="p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-ink">Drawings</h1>
          <p className="text-body text-graphite mt-1">
            {projects.length > 0
              ? `${projects.length} folder${projects.length !== 1 ? 's' : ''}`
              : 'Organize your drawings into folders.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedProject && (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-40 pl-9 pr-4 py-2 bg-white rounded-[12px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all border border-dove/10"
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
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input ref={fileInputRef} type="file" accept=".pdf,.dwg,.dwf,.png,.jpg" className="hidden" onChange={handleUpload} />
            </>
          )}
          <Button variant="secondary" onClick={() => setShowNewFolder(true)}>
            <FolderPlus size={16} className="mr-1.5" />
            New Folder
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-body text-red-700">
          Upload failed: {uploadError}
        </div>
      )}

      {/* New folder popup */}
      {showNewFolder && (
        <Card padding="md">
          <div className="flex items-center gap-3">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 px-4 py-2 bg-white rounded-[12px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 border border-dove/20"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Main content */}
      {loadingProjects ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-graphite animate-spin" />
          </div>
        </Card>
      ) : projects.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mb-4">
              <Folder size={24} className="text-graphite" />
            </div>
            <h3 className="text-subheading text-ink mb-1">No folders yet</h3>
            <p className="text-body text-graphite mb-6 max-w-sm text-center">
              Create a folder to start organizing your drawing uploads.
            </p>
            <Button onClick={() => setShowNewFolder(true)}>
              <FolderPlus size={16} className="mr-1.5" />
              New Folder
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Folder list sidebar */}
          <div className="lg:col-span-1 space-y-1">
            <h2 className="text-caption text-graphite font-[430] px-1 mb-2 uppercase tracking-wider">Folders</h2>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${selectedProject?.id === p.id ? 'bg-rust/10 text-ink' : 'hover:bg-fog text-graphite hover:text-ink'}`}
              >
                <Folder size={16} className="shrink-0" />
                <span className="text-body font-[450] truncate flex-1">{p.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(p.id) }}
                  className="text-dove/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))}
          </div>

          {/* Revisions panel */}
          <div className="lg:col-span-3">
            {selectedProject && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-subheading text-ink">{selectedProject.name}</h2>
                  <span className="text-caption text-graphite">
                    — {revisions.length} upload{revisions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {loadingRevisions ? (
                  <Card padding="lg">
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="text-graphite animate-spin" />
                    </div>
                  </Card>
                ) : filteredRevisions.length === 0 ? (
                  <Card padding="lg">
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText size={24} className="text-graphite mb-3" />
                      <h3 className="text-subheading text-ink mb-1">No uploads yet</h3>
                      <p className="text-body text-graphite mb-4 text-center max-w-sm">
                        Upload a drawing to this folder to start tracking revisions.
                      </p>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} className="mr-1.5" />
                        Upload Drawing
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="bg-white rounded-[24px] shadow-subtle border border-dove/10 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dove/10">
                          <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Revision</th>
                          <th className="text-left text-caption text-graphite font-[430] px-5 py-3">Uploaded</th>
                          <th className="text-right text-caption text-graphite font-[430] px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRevisions.map((r) => (
                          <tr key={r.id} className="border-b border-dove/10 last:border-0 hover:bg-fog/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-fog rounded-lg flex items-center justify-center">
                                  <FileText size={14} className="text-graphite" />
                                </div>
                                <span className="text-body text-ink font-[450]">Rev {r.revision_number}</span>
                              </div>
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
                                <span className="text-dove/30 text-body font-light select-none">/</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRevision(r.id) }}
                                  className="text-dove/40 hover:text-red-400 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
