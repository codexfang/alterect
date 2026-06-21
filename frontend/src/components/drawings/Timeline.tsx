import { Fragment } from 'react'
import { cn } from '@/lib/utils'

interface TimelineNode {
  revision: string
  date: string
  changeCount: number
  active?: boolean
}

interface TimelineProps {
  nodes: TimelineNode[]
  activeRevision: string
  onSelect: (revision: string) => void
}

export function Timeline({ nodes, activeRevision, onSelect }: TimelineProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide py-4">
      {nodes.map((node, i) => {
        const isActive = node.revision === activeRevision
        return (
          <Fragment key={node.revision}>
            <button
              onClick={() => onSelect(node.revision)}
              className="relative flex flex-col items-center gap-2 shrink-0 group"
            >
              <span className="text-caption text-graphite whitespace-nowrap">{node.date}</span>
              <div
                className={cn(
                  'relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive ? 'bg-rust text-white' : 'bg-white border-2 border-dove/30 text-graphite hover:border-rust/50'
                )}
              >
                <span className="text-[13px] font-[450]">{node.revision}</span>
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-ink text-white text-[11px] px-2 py-1 rounded-md pointer-events-none">
                  {node.changeCount} changes
                </div>
              </div>
              {isActive && (
                <span className="w-1 h-1 bg-rust rounded-full" />
              )}
            </button>
            {i < nodes.length - 1 && (
              <div
                className={cn(
                  'w-8 h-[2px] shrink-0',
                  isActive ? 'bg-rust' : 'bg-dove/40'
                )}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
