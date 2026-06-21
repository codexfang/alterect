import { motion, AnimatePresence } from 'framer-motion'
import { cn, SEVERITY_COLORS, SEVERITY_TEXT_COLORS, type Trade, TRADE_DOT_COLORS } from '@/lib/utils'

interface ChangeItem {
  id: string
  type: string
  description: string
  trade: Trade
  severity: 'low' | 'medium' | 'high'
}

interface ChangeListProps {
  changes: ChangeItem[]
  activeChangeId: string | null
  onSelect: (id: string) => void
}

export function ChangeList({ changes, activeChangeId, onSelect }: ChangeListProps) {
  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {changes.map((change) => (
          <motion.button
            key={change.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => onSelect(change.id)}
            className={cn(
              'w-full text-left p-3 rounded-xl transition-all duration-200',
              activeChangeId === change.id
                ? 'bg-white shadow-subtle border border-dove/10'
                : 'hover:bg-white/50'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TRADE_DOT_COLORS[change.trade] }}
              />
              <span className="text-[13px] font-[450] text-ink capitalize">{change.type.replace(/_/g, ' ')}</span>
              <span
                className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full font-[430]"
                style={{
                  backgroundColor: SEVERITY_COLORS[change.severity],
                  color: SEVERITY_TEXT_COLORS[change.severity],
                }}
              >
                {change.severity}
              </span>
            </div>
            <p className="text-[13px] text-graphite ml-4">{change.description}</p>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
