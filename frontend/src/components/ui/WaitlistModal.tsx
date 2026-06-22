import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
}

export default function WaitlistModal({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error: insertError } = await supabase.from('waitlist').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim() || null,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSubmitted(true)
  }

  const handleClose = () => {
    setName('')
    setEmail('')
    setCompany('')
    setSubmitted(false)
    setError('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative bg-white rounded-[24px] shadow-[rgba(4,23,43,0.08)_0px_0px_0px_1px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] max-w-md w-full p-8"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-fog flex items-center justify-center hover:bg-fog/80 transition-colors"
            >
              <X size={16} className="text-graphite" />
            </button>

            {submitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <h3 className="font-serif text-heading text-ink">You're on the list</h3>
                <p className="text-body text-graphite mt-3 max-w-xs mx-auto">
                  Thanks, {name.split(' ')[0]}! We'll let you know as soon as Alterect launches.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <span className="text-caption text-rust font-[450] uppercase tracking-widest">Get early access</span>
                  <h3 className="font-serif text-heading text-ink mt-1">Join the waitlist</h3>
                  <p className="text-body text-ash mt-2">
                    Be the first to know when Alterect launches.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-caption text-graphite font-[430] block mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-white rounded-[16px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 border border-dove/20"
                    />
                  </div>
                  <div>
                    <label className="text-caption text-graphite font-[430] block mb-1">Company / School</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-4 py-3 bg-white rounded-[16px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 border border-dove/20"
                    />
                  </div>
                  <div>
                    <label className="text-caption text-graphite font-[430] block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-4 py-3 bg-white rounded-[16px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 border border-dove/20"
                    />
                  </div>

                  {error && (
                    <p className="text-[13px] text-red-600 text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Joining...' : 'Join waitlist'}
                    <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
