const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://alterect-api.onrender.com'

export const backendApi = {
  async uploadDrawing(file: File, userId: string, discipline = '', projectId = '') {
    const form = new FormData()
    form.append('file', file)
    form.append('user_id', userId)
    form.append('discipline', discipline)
    form.append('project_id', projectId)
    const res = await fetch(`${API_BASE}/api/drawings-proxy/upload`, { method: 'POST', body: form })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Upload failed (${res.status})`)
    }
    return res.json() as Promise<{ drawing: any; revision: any; file_url: string; project_id: string }>
  },

  async listDrawings(userId: string) {
    const res = await fetch(`${API_BASE}/api/drawings-proxy/list?user_id=${encodeURIComponent(userId)}`)
    if (!res.ok) return []
    return res.json() as Promise<any[]>
  },

  async getDrawing(drawingId: string) {
    const res = await fetch(`${API_BASE}/api/drawings-proxy/drawing?drawing_id=${encodeURIComponent(drawingId)}`)
    if (!res.ok) return null
    return res.json() as Promise<any>
  },

  async listRevisions(drawingId: string) {
    const res = await fetch(`${API_BASE}/api/drawings-proxy/revisions?drawing_id=${encodeURIComponent(drawingId)}`)
    if (!res.ok) return []
    return res.json() as Promise<any[]>
  },

  async listProjects(userId: string) {
    const res = await fetch(`${API_BASE}/api/drawings-proxy/projects/list?user_id=${encodeURIComponent(userId)}`)
    if (!res.ok) return []
    return res.json() as Promise<any[]>
  },

  async createProject(userId: string, name: string) {
    const form = new FormData()
    form.append('user_id', userId)
    form.append('name', name)
    const res = await fetch(`${API_BASE}/api/drawings-proxy/projects/create`, { method: 'POST', body: form })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Create folder failed (${res.status})`)
    }
    return res.json() as Promise<any>
  },

  async deleteProject(projectId: string, userId: string) {
    const res = await fetch(`${API_BASE}/api/drawings-proxy/projects/delete?project_id=${encodeURIComponent(projectId)}&user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Delete folder failed (${res.status})`)
    }
    return res.json() as Promise<{ status: string; project_id: string }>
  },

  async deleteDrawing(drawingId: string, userId: string) {
    const res = await fetch(`${API_BASE}/api/drawings-proxy/delete?drawing_id=${encodeURIComponent(drawingId)}&user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Delete failed (${res.status})`)
    }
    return res.json() as Promise<{ status: string; drawing_id: string }>
  },

  async deleteRevision(revisionId: string, userId: string) {
    const res = await fetch(`${API_BASE}/api/drawings-proxy/revisions/delete?revision_id=${encodeURIComponent(revisionId)}&user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Delete revision failed (${res.status})`)
    }
    return res.json() as Promise<{ status: string; revision_id: string }>
  },

  // ─── Alerts ───

  async generateAlerts(data: {
    user_id: string
    drawing_id: string
    sheet_name: string
    project_id: string
    discipline: string
    from_revision_number: number
    to_revision_number: number
    change_count: number
    change_percentage: number
  }) {
    const res = await fetch(`${API_BASE}/api/alerts-proxy/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Alert generation failed (${res.status})`)
    }
    return res.json() as Promise<{ status: string; alerts: any[] }>
  },

  async listAlerts(userId: string) {
    const res = await fetch(`${API_BASE}/api/alerts-proxy/list?user_id=${encodeURIComponent(userId)}`)
    if (!res.ok) return []
    return res.json() as Promise<any[]>
  },

  async markAlertRead(alertId: string, userId: string) {
    const res = await fetch(`${API_BASE}/api/alerts-proxy/read?alert_id=${encodeURIComponent(alertId)}&user_id=${encodeURIComponent(userId)}`, { method: 'PUT' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Failed to mark alert read (${res.status})`)
    }
    return res.json() as Promise<{ status: string }>
  },

  async markAllAlertsRead(userId: string) {
    const res = await fetch(`${API_BASE}/api/alerts-proxy/read-all?user_id=${encodeURIComponent(userId)}`, { method: 'PUT' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Failed to mark all read (${res.status})`)
    }
    return res.json() as Promise<{ status: string }>
  },

  async unreadAlertCount(userId: string) {
    const res = await fetch(`${API_BASE}/api/alerts-proxy/unread-count?user_id=${encodeURIComponent(userId)}`)
    if (!res.ok) return { count: 0 }
    return res.json() as Promise<{ count: number }>
  },
}
