import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-fog rounded-[16px]', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2 text-body rounded-[14px] transition-all duration-200',
            active === tab.id ? 'text-ink' : 'text-graphite hover:text-ink'
          )}
        >
          {active === tab.id && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 bg-white rounded-[14px] shadow-subtle"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
