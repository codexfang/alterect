import { api } from './client'

export interface Alert {
  id: string
  project_id: string
  trade: string
  change_id: string
  message: string
  read: boolean
  created_at: string
}

export interface AlertSubscription {
  id: string
  project_id: string
  trade: string
  webhook_url?: string
  email?: string
  is_active: boolean
}

export const alertsApi = {
  subscribe: (body: { project_id: string; trade: string; webhook_url?: string; email?: string }) =>
    api.post<AlertSubscription>('/alerts/subscribe', body),

  getAlerts: (projectId: string, params?: { trade?: string }) => {
    const query = new URLSearchParams()
    if (params?.trade) query.set('trade_filter', params.trade)
    const qs = query.toString()
    return api.get<Alert[]>(`/projects/${projectId}/alerts${qs ? `?${qs}` : ''}`)
  },

  markRead: (alertId: string) =>
    api.put<void>(`/alerts/${alertId}/read`, {}),

  markAllRead: (projectId: string) =>
    api.put<void>(`/projects/${projectId}/alerts/read-all`, {}),
}
