import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const ALLOWED_EMAIL = 'jasonfang102@gmail.com'

export default function Login() {
  const navigate = useNavigate()
  const { login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ALLOWED_EMAIL) {
        await logout()
        setError('Alterect is not yet available to the public.')
        return
      }
      navigate('/dashboard')
    } catch {
      setError('Alterect is not yet available to the public.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <span className="font-serif text-heading-sm text-ink">Alterect</span>
          </div>
          <h1 className="text-heading text-ink mb-1">Welcome back</h1>
          <p className="text-body text-graphite mb-8">Sign in to your account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@alterect.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <div className="flex items-center justify-between text-caption">
              <label className="flex items-center gap-2 text-graphite">
                <input type="checkbox" className="rounded border-dove" />
                Remember me
              </label>
              <a href="#" className="text-ink hover:underline">Forgot password?</a>
            </div>
            <Button type="submit" className="w-full">
              Sign in
              <ArrowRight size={18} className="ml-1.5" />
            </Button>
            {error && (
              <p className="text-[13px] text-red-600 text-center">{error}</p>
            )}
          </form>
        </motion.div>
      </div>

      {/* Right */}
      <div className="hidden lg:flex w-1/2 bg-fog items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 bg-apricot-wash rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[24px]">📐</span>
          </div>
          <h3 className="text-subheading text-ink mb-2">Never build from the wrong drawing</h3>
          <p className="text-body text-graphite">Alterect automatically detects every change between revisions and alerts your team before rework happens.</p>
        </div>
      </div>
    </div>
  )
}
