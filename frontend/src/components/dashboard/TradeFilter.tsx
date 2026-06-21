import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { motion as m } from 'framer-motion'
import { Filter, Check } from 'lucide-react'
import { cn, TRADES, type Trade, TRADE_DOT_COLORS } from '@/lib/utils'

interface TradeFilterProps {
  selected: Trade[]
  onChange: (trades: Trade[]) => void
}

export function TradeFilter({ selected, onChange }: TradeFilterProps) {
  const [open, setOpen] = useState(false)

  const toggle = (trade: Trade) => {
    if (selected.includes(trade)) {
      onChange(selected.filter((t) => t !== trade))
    } else {
      onChange([...selected, trade])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-dove/20 rounded-[9999px] text-body text-ink hover:border-dove/40 transition-all shadow-subtle"
      >
        <Filter size={16} strokeWidth={1.5} />
        <span>Filter Trade</span>
        {selected.length > 0 && (
          <span className="w-5 h-5 bg-ink text-white text-[11px] rounded-full flex items-center justify-center">
            {selected.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-2 left-0 z-40 min-w-[200px] bg-white rounded-2xl shadow-subtle border border-dove/10 p-2"
          >
            {TRADES.map((trade) => (
              <button
                key={trade}
                onClick={() => toggle(trade)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-fog transition-colors text-body text-ink"
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                    selected.includes(trade)
                      ? 'bg-ink border-ink'
                      : 'border-dove'
                  )}
                >
                  {selected.includes(trade) && (
                    <Check size={10} className="text-white" strokeWidth={3} />
                  )}
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TRADE_DOT_COLORS[trade] }}
                />
                <span className="capitalize">{trade}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
