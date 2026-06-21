import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-rust text-white hover:bg-rust/90 border border-transparent',
  secondary: 'bg-fog text-ink hover:bg-white hover:border-rust/30 border border-dove/10',
  ghost: 'bg-transparent text-ink hover:text-rust border border-dove/20 hover:border-rust/40',
  danger: 'bg-rust text-white hover:bg-rust/90 border border-transparent',
}

const sizes = {
  sm: 'px-4 py-1.5 text-caption',
  md: 'px-5 py-2 text-body',
  lg: 'px-6 py-3 text-body-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-[9999px] font-[430] transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:shadow-[0_0_20px_rgba(93,42,26,0.15)] hover:scale-[1.02]',
        sizes[size],
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
