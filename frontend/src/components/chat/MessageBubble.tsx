import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  content: string
  role: 'user' | 'assistant'
  timestamp?: string
}

export function MessageBubble({ content, role, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-[20px] p-4',
          isUser
            ? 'bg-ink text-white'
            : 'bg-white shadow-subtle border border-dove/10'
        )}
      >
        <p className={cn('text-body leading-relaxed', isUser ? 'text-white' : 'text-ink')}>{content}</p>
        {timestamp && (
          <p className={cn('text-[11px] mt-1.5', isUser ? 'text-white/50' : 'text-graphite')}>{timestamp}</p>
        )}
      </div>
    </motion.div>
  )
}
