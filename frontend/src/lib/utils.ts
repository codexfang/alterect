import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export const TRADES = ['electrical', 'plumbing', 'structural', 'hvac', 'other'] as const
export type Trade = (typeof TRADES)[number]

export const TRADE_COLORS: Record<Trade, string> = {
  electrical: '#d3e3fc',
  plumbing: '#fbe1d1',
  structural: '#a3a6af',
  hvac: '#777b86',
  other: '#4c4c4c',
}

export const TRADE_DOT_COLORS: Record<Trade, string> = {
  electrical: '#3b82f6',
  plumbing: '#f59e0b',
  structural: '#6b7280',
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
