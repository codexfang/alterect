import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, ArrowUpRight } from 'lucide-react'
import { cn, type Trade, TRADE_DOT_COLORS } from '@/lib/utils'

interface AlertItem {
  id: string
  title: string
  trade: Trade
  sheet: string
  revision: string
  time: string
  read: boolean
}

interface AlertFeedProps {
  alerts: AlertItem[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onNavigateToAlerts?: () => void
}

export function AlertFeed({ alerts, onMarkRead, onMarkAllRead, onNavigateToAlerts }: AlertFeedProps) {
  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div className="bg-white rounded-[24px] shadow-subtle">
      <div className="flex items-center justify-between p-5 border-b border-dove/10">
        <div className="flex items-center gap-2">
          <Bell size={18} strokeWidth={1.5} className="text-graphite" />
          <span className="text-body font-[450] text-ink">Recent Alerts</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-apricot-wash text-rust text-[12px] rounded-full font-[450]">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 text-caption text-graphite hover:text-ink transition-colors"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-dove/10">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => onMarkRead(alert.id)}
              className={cn(
                'flex items-start gap-3 p-4 cursor-pointer transition-colors',
                !alert.read && 'bg-apricot-wash/20'
              )}
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: TRADE_DOT_COLORS[alert.trade] }}
              />
              <div className="flex-1 min-w-0">
                <p className={cn('text-[14px] leading-snug', alert.read ? 'text-graphite' : 'text-ink')}>
                  {alert.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-graphite">{alert.sheet}</span>
                  <span className="text-[12px] text-graphite">Rev {alert.revision}</span>
                  <span className="text-[12px] text-graphite">·</span>
                  <span className="text-[12px] text-graphite">{alert.time}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onNavigateToAlerts?.() }}
                className="shrink-0 mt-1 text-graphite hover:text-ink transition-colors"
              >
                <ArrowUpRight size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {alerts.length > 0 && onNavigateToAlerts && (
        <button
          onClick={onNavigateToAlerts}
          className="w-full text-center text-[13px] text-graphite hover:text-ink py-3 border-t border-dove/10 transition-colors"
        >
          View all alerts
        </button>
      )}

      {alerts.length === 0 && (
        <div className="p-8 text-center">
          <Bell size={24} className="text-dove mx-auto mb-2" />
          <p className="text-body text-graphite">No alerts yet</p>
          <p className="text-caption text-dove mt-1">Alerts will appear when drawing changes are detected</p>
        </div>
      )}
    </div>
  )
}
