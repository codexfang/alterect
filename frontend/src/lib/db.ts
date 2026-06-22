import { supabase } from './supabase'
import { backendApi } from './backendApi'
import type { Trade } from './utils'

// ─── TYPES ───

export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  company: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  trade_filters: string[]
  theme: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  address: string | null
  status: 'active' | 'archived' | 'completed'
  created_at: string
  updated_at: string
}

export interface Drawing {
  id: string
  project_id: string
  user_id: string
  sheet_name: string
  discipline: string | null
  current_revision: number
  file_url: string | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export interface Revision {
  id: string
  drawing_id: string
  revision_number: number
  file_url: string
  uploaded_by: string
  change_count: number
  notes: string | null
  created_at: string
}

export interface Change {
  id: string
  drawing_id: string
  from_revision_id: string | null
  to_revision_id: string
  change_type: 'added' | 'removed' | 'modified' | 'relocated' | 'resized'
  trade: string
  severity: 'low' | 'medium' | 'high'
  description: string
  coordinates: any
  sheet_name: string | null
  floor: string | null
  created_at: string
}

export interface Alert {
  id: string
  user_id: string
  change_id: string | null
  project_id: string | null
  title: string
  description: string | null
  trade: string
  sheet_name: string | null
  revision: string | null
  severity: string | null
  read: boolean
  created_at: string
}

// ─── PROFILES ───

export const profiles = {
  get: async () => {
    const { data } = await supabase.from('profiles').select('*').single()
    return data as Profile | null
  },
  update: async (updates: Partial<Profile>) => {
    const { data } = await supabase.from('profiles').update(updates).eq('id', updates.id!).single()
    return data as Profile | null
  },
}

// ─── PREFERENCES ───

export const preferences = {
  getOrCreate: async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null

    let { data } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single()
    if (!data) {
      const { data: newPref } = await supabase.from('user_preferences').insert({ user_id: user.id }).select().single()
      data = newPref
    }
    return data as UserPreferences | null
  },
  update: async (updates: Partial<UserPreferences>) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null
    const { data } = await supabase.from('user_preferences').update(updates).eq('user_id', user.id).select().single()
    return data as UserPreferences | null
  },
}

// ─── PROJECTS ───

export const projects = {
  list: async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return []
    return (await backendApi.listDrawings(user.id)).reduce((acc: Project[], d: any) => {
      if (!acc.find((p) => p.id === d.project_id)) {
        acc.push({ id: d.project_id, user_id: user.id, name: 'Project', address: null, status: 'active', created_at: d.created_at, updated_at: d.updated_at })
      }
      return acc
    }, [])
  },
  create: async (name: string, address?: string) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null
    return backendApi.getOrCreateDefaultProject(user.id) as Promise<Project | null>
  },
  getOrCreateDefault: async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null
    return backendApi.getOrCreateDefaultProject(user.id) as Promise<Project | null>
  },
}

// ─── DRAWINGS ───

export const drawings = {
  list: async (projectId?: string) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return []
    const drawings = await backendApi.listDrawings(user.id)
    if (projectId) return drawings.filter((d: any) => d.project_id === projectId) as Drawing[]
    return drawings as Drawing[]
  },
  get: async (id: string) => {
    return backendApi.getDrawing(id) as Promise<Drawing | null>
  },
  create: async (drawing: { project_id: string; sheet_name: string; discipline?: string; file_url?: string }) => {
    return null
  },
}

// ─── REVISIONS ───

export const revisions = {
  create: async (r: { drawing_id: string; revision_number: number; file_url: string; notes?: string }) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null
    return null
  },
  listForDrawing: async (drawingId: string) => {
    return backendApi.listRevisions(drawingId) as Promise<Revision[]>
  },
}

// ─── CHANGES ───

export const changes = {
  list: async (drawingId?: string) => {
    let query = supabase.from('changes').select('*').order('created_at', { ascending: false })
    if (drawingId) query = query.eq('drawing_id', drawingId)
    const { data } = await query
    return (data as Change[]) ?? []
  },
  countByTrade: async (userId: string) => {
    const { data } = await supabase
      .from('changes')
      .select('trade, count')
      .order('count', { ascending: false })
    return data ?? []
  },
}

// ─── ALERTS ───

export const alerts = {
  list: async (unreadOnly = false) => {
    let query = supabase.from('alerts').select('*').order('created_at', { ascending: false })
    if (unreadOnly) query = query.eq('read', false)
    const { data } = await query
    return (data as Alert[]) ?? []
  },
  markRead: async (id: string) => {
    await supabase.from('alerts').update({ read: true }).eq('id', id)
  },
  markAllRead: async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    await supabase.from('alerts').update({ read: true }).eq('user_id', user.id).eq('read', false)
  },
}

// ─── STORAGE ───

const BUCKET = 'drawings'

export const storage = {
  ensureBucket: async () => {
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find((b) => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true })
    }
  },

  uploadDrawing: async (file: File, userId: string) => {
    const ext = file.name.split('.').pop() ?? 'pdf'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw error
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { path, url: urlData.publicUrl }
  },

  deleteDrawing: async (path: string) => {
    await supabase.storage.from(BUCKET).remove([path])
  },
}

// ─── INTEGRATIONS ───

export const integrations = {
  list: async () => {
    const { data } = await supabase.from('integrations').select('*').order('created_at', { ascending: false })
    return (data as Integration[]) ?? []
  },
  get: async (provider: string) => {
    const { data } = await supabase.from('integrations').select('*').eq('provider', provider).maybeSingle()
    return data as Integration | null
  },
  connect: async (provider: string) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null
    const existing = await supabase.from('integrations').select('*').eq('provider', provider).eq('user_id', user.id).maybeSingle()
    if (existing.data) {
      const { data } = await supabase.from('integrations').update({ connected: true, updated_at: new Date().toISOString() }).eq('id', existing.data.id).select().single()
      return data as Integration | null
    }
    const { data } = await supabase.from('integrations').insert({ user_id: user.id, provider, connected: true }).select().single()
    return data as Integration | null
  },
  disconnect: async (provider: string) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    await supabase.from('integrations').update({ connected: false, updated_at: new Date().toISOString() }).eq('provider', provider).eq('user_id', user.id)
  },
}

export interface Integration {
  id: string
  user_id: string
  provider: string
  access_token: string | null
  refresh_token: string | null
  connected: boolean
  settings: any
  created_at: string
  updated_at: string
}

// ─── STATS (aggregated for dashboard) ───

export const stats = {
  overview: async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return null

    const drawings = await backendApi.listDrawings(user.id)

    return {
      totalDrawings: drawings.length,
      openChanges: 0,
      unreadAlerts: 0,
    }
  },
}
