import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'warm' | 'cool'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variants = {
  default: 'bg-white',
  warm: 'bg-apricot-wash',
  cool: 'bg-sky-wash',
}

const paddings = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className, variant = 'default', hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] shadow-subtle',
        variants[variant],
        paddings[padding],
        hover && 'transition-all duration-300 hover:scale-[1.01] hover:shadow-[rgba(4,23,43,0.08)_0px_0px_0px_1px,rgba(0,0,0,0.15)_0px_20px_25px_-5px,rgba(0,0,0,0.12)_0px_8px_10px_-6px]',
        className
      )}
    >
      {children}
    </div>
  )
}
