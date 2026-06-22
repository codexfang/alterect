import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  GitCompare,
  Bell,
  Link2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/drawings', icon: FileText, label: 'Drawings' },
  { to: '/diffs', icon: GitCompare, label: 'Diffs' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/integrations', icon: Link2, label: 'Integrations' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-fog flex flex-col py-6 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className={cn('px-5 mb-8 flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.span
              key="logo-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif text-heading-sm text-ink whitespace-nowrap"
            >
              Alterect
            </motion.span>
          ) : (
            <motion.span
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif text-heading-sm text-ink"
            >
              A
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-graphite hover:text-ink transition-colors p-1 rounded-lg hover:bg-white/50"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-white text-ink shadow-subtle'
                  : 'text-graphite hover:text-ink hover:bg-white/40',
                collapsed && 'justify-center'
              )
            }
          >
            <item.icon size={18} strokeWidth={1.5} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key={item.label}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-[15px] font-[450] whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Current User */}
      <AnimatePresence>
        {!collapsed && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 pt-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0 bg-green-500" />
              <div className="min-w-0">
                <p className="text-[13px] font-[450] text-ink truncate">{user.name}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
