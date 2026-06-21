import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Link, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState(user?.name ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ data: { name } })
    if (error) setMessage(error.message)
    else setMessage('Profile updated')
    setSaving(false)
  }

  const handleUpdatePassword = async () => {
    if (!password) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMessage(error.message)
    else { setMessage('Password updated'); setPassword('') }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6 pb-16">
      <div>
        <h1 className="text-heading-sm text-ink">Settings</h1>
        <p className="text-body text-graphite mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-6">
          <Tabs
          tabs={[
            { id: 'profile', label: 'Profile', icon: <User size={16} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
            { id: 'integrations', label: 'Integrations', icon: <Link size={16} /> },
            { id: 'security', label: 'Security', icon: <Shield size={16} /> },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {message && (
          <p className="text-[13px] text-green-600">{message}</p>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card padding="lg">
              <h3 className="text-subheading text-ink mb-4">Profile Information</h3>
              <div className="space-y-4">
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email" value={user?.email ?? ''} disabled />
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card padding="lg">
              <h3 className="text-subheading text-ink mb-4">Notification Preferences</h3>
              <p className="text-body text-graphite">Configure how you receive change alerts.</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Email notifications', desc: 'Receive alert summaries via email' },
                  { label: 'Slack notifications', desc: 'Connect Slack to get real-time alerts' },
                  { label: 'In-app notifications', desc: 'Show alerts in the notification tray' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-body text-ink font-[450]">{item.label}</p>
                      <p className="text-caption text-graphite">{item.desc}</p>
                    </div>
                    <div className="w-10 h-6 bg-fog rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card padding="lg">
              <h3 className="text-subheading text-ink mb-4">Connected Services</h3>
              <p className="text-body text-graphite">No integrations connected yet.</p>
              <Button variant="secondary" className="mt-4" onClick={() => window.location.href = '/integrations'}>
                <Link size={16} className="mr-1.5" />
                Browse integrations
              </Button>
            </Card>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card padding="lg">
              <h3 className="text-subheading text-ink mb-4">Password</h3>
              <p className="text-caption text-graphite mb-3">Change your account password</p>
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button variant="secondary" className="mt-3" onClick={handleUpdatePassword} disabled={saving || !password}>
                {saving ? 'Updating...' : 'Update password'}
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  )
}
