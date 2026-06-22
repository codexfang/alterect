import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export const TRADES = ['architectural', 'structural', 'electrical', 'mechanical', 'plumbing', 'civil', 'hvac', 'other'] as const
export type Trade = (typeof TRADES)[number]

export const TRADE_COLORS: Record<string, string> = {
  architectural: '#d3e3fc',
  structural: '#a3a6af',
  electrical: '#d3e3fc',
  mechanical: '#777b86',
  plumbing: '#fbe1d1',
  civil: '#c4b5a0',
  hvac: '#777b86',
  other: '#4c4c4c',
}

export const TRADE_DOT_COLORS: Record<string, string> = {
  architectural: '#60a5fa',
  structural: '#6b7280',
  electrical: '#3b82f6',
  mechanical: '#8b5cf6',
  plumbing: '#f59e0b',
  civil: '#a8a29e',
  hvac: '#8b5cf6',
  other: '#17191c',
}

export const SEVERITY_COLORS = {
  low: '#d3e3fc',
  medium: '#fbe1d1',
  high: '#5d2a1a',
} as const

export const SEVERITY_TEXT_COLORS = {
  low: '#3b82f6',
  medium: '#d97706',
  high: '#5d2a1a',
} as const
