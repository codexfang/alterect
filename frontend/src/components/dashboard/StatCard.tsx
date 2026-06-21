import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  delta?: { value: string; positive: boolean }
  chart?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, delta, chart, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-white rounded-[24px] p-5 shadow-subtle', className)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[13px] text-graphite font-[430]">{label}</span>
        {delta && (
          <span
            className={cn(
              'flex items-center gap-1 text-[13px] font-[450]',
              delta.positive ? 'text-green-600' : 'text-rust'
            )}
          >
            {delta.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {delta.value}
          </span>
        )}
      </div>
      <span className="block text-[44px] font-serif text-ink leading-none tracking-[-0.66px]">
        {value}
      </span>
      {chart && <div className="mt-3">{chart}</div>}
    </motion.div>
  )
}
