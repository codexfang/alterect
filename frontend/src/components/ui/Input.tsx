import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-caption text-graphite mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-3 bg-white border border-dove/30 rounded-[16px] text-body text-ink',
          'placeholder:text-graphite/60',
          'focus:outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10',
          'transition-all duration-200',
          error && 'border-rust focus:border-rust focus:ring-rust/10',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-caption text-rust">{error}</p>}
    </div>
  )
)

Input.displayName = 'Input'
