import { api } from './client'

export interface Drawing {
  id: string
  project_id: string
  sheet_name: string
  revision: string
  file_url: string
  uploaded_by: string
  created_at: string
}

export interface Change {
  id: string
  drawing_id: string
  previous_revision: string
  change_type: string
  coordinates: { x: number; y: number; width?: number; height?: number }
  trade: string
  severity: string
  description: string
}

export interface DiffResult {
  sheet_id: string
  changes: Change[]
  summary: string
}

export interface TimelineEntry {
  id: string
  revision: string
  created_at: string
  change_count: number
  uploaded_by: string
}

export const drawingsApi = {
  upload: (formData: FormData) =>
    api.post<Drawing>('/drawings/upload', formData),

  diff: (drawingId1: string, drawingId2: string) =>
    api.post<DiffResult>('/drawings/diff', {
      drawing_id_1: drawingId1,
      drawing_id_2: drawingId2,
    }),

  getTimeline: (drawingId: string) =>
    api.get<TimelineEntry[]>(`/drawings/${drawingId}/timeline`),

  getChanges: (drawingId: string, params?: { since_revision?: string; trade_filter?: string }) => {
    const query = new URLSearchParams()
    if (params?.since_revision) query.set('since_revision', params.since_revision)
    if (params?.trade_filter) query.set('trade_filter', params.trade_filter)
    const qs = query.toString()
    return api.get<Change[]>(`/drawings/${drawingId}/changes${qs ? `?${qs}` : ''}`)
  },

  list: (projectId?: string) => {
    const qs = projectId ? `?project_id=${projectId}` : ''
    return api.get<Drawing[]>(`/drawings${qs}`)
  },
}
