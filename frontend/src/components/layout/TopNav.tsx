import { useNavigate } from 'react-router-dom'
import { Bell, Search, LogOut } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { useAuth } from '@/hooks/useAuth'

export function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-dove/10">
      <div className="relative max-w-md w-full">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite" />
        <input
          type="text"
          placeholder="Search drawings, changes, or projects..."
          className="w-full pl-9 pr-4 py-2 bg-fog rounded-[12px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        <Dropdown
          trigger={
            <div className="relative">
              <Bell size={20} strokeWidth={1.5} className="text-graphite" />
            </div>
          }
          align="right"
          className="w-80"
        >
          <div className="px-3 py-2 border-b border-dove/10">
            <span className="text-body font-[450] text-ink">Notifications</span>
          </div>
          <div className="px-3 py-6 text-center text-caption text-graphite">
            No notifications yet
          </div>
        </Dropdown>

        <Dropdown
          trigger={
            <button className="w-8 h-8 bg-ink rounded-full flex items-center justify-center text-white text-[13px] font-[450]">
              {initials}
            </button>
          }
          align="right"
          className="w-64"
        >
          <div className="px-3 py-2 border-b border-dove/10">
            <p className="text-body font-[450] text-ink">{user?.name}</p>
          </div>

          <div className="px-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-body rounded-xl transition-colors duration-150 text-ash hover:bg-fog hover:text-ink flex items-center gap-2"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}
