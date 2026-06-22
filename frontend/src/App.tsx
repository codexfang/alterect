import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/Toast'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { ChatInterface } from '@/components/chat/ChatInterface'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import Drawings from '@/pages/Drawings'
import DiffView from '@/pages/DiffView'
import Alerts from '@/pages/Alerts'
import Integrations from '@/pages/Integrations'
import Login from '@/pages/Login'
import Legal from '@/pages/Legal'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#ffffff]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-fog">
          {children}
        </main>
      </div>
      <ChatInterface />
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
  return <AppLayout>{children}</AppLayout>
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
