import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Monitor } from 'lucide-react'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Drawings from '@/pages/Drawings'
import DiffView from '@/pages/DiffView'
import Alerts from '@/pages/Alerts'
import Integrations from '@/pages/Integrations'
import { Sidebar } from '@/components/layout/Sidebar'
import Legal from '@/pages/Legal'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

function DesktopOnly({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fog p-6">
        <div className="bg-white rounded-[24px] shadow-subtle p-8 max-w-sm text-center">
          <div className="w-14 h-14 bg-fog rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Monitor size={24} className="text-graphite" />
          </div>
          <h2 className="text-subheading text-ink mb-2">Desktop only</h2>
          <p className="text-body text-graphite leading-relaxed">
            Alterect's dashboard is designed for desktop. Please open this page on a computer.
          </p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const showSidebar = !['/login', '/signup', '/privacy', '/terms', '/cookies', '/developer'].includes(location.pathname)

  if (!showSidebar) return <>{children}</>
  return (
    <div className="flex min-h-screen bg-fog">
      <Sidebar />
      <main className="flex-1 ml-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-dove rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-dove rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-dove rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <DesktopOnly><AppLayout>{children}</AppLayout></DesktopOnly>
}

export default function App() {
  return (
    <BrowserRouter basename="/">
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/overview" element={<Landing />} />
            <Route path="/workflow" element={<Landing />} />
            <Route path="/features" element={<Landing />} />
            <Route path="/pricing" element={<Landing />} />
            <Route path="/resources" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/developer" element={<Navigate to="/login" replace />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/privacy" element={<Legal />} />
            <Route path="/terms" element={<Legal />} />
            <Route path="/cookies" element={<Legal />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/drawings" element={<ProtectedRoute><Drawings /></ProtectedRoute>} />
            <Route path="/diffs/:id?" element={<ProtectedRoute><DiffView /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
