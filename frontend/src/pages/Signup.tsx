import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signup(email, password, name)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
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
          <h1 className="text-heading text-ink mb-1">Get started</h1>
          <p className="text-body text-graphite mb-8">Create your Alterect account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Chen"
            />
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
              placeholder="Create a strong password"
            />
            <Button type="submit" className="w-full">
              Create account
              <ArrowRight size={18} className="ml-1.5" />
            </Button>
          </form>
          <p className="text-center text-caption text-graphite mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-ink font-[450] hover:underline">Sign in</a>
          </p>
        </motion.div>
      </div>

      {/* Right */}
      <div className="hidden lg:flex w-1/2 bg-fog items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 bg-sky-wash rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[24px]">🏗️</span>
          </div>
          <h3 className="text-subheading text-ink mb-2">Start your 7-day free trial</h3>
          <p className="text-body text-graphite">Enter valid billing info to get started. You will not be charged until the trial ends — cancel anytime before that and you pay nothing.</p>
        </div>
      </div>
    </div>
  )
}
