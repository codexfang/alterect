import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageSquare, X } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export function ChatInterface() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm connected to your project data. Ask me about drawings, changes, or anything in your account.`,
      role: 'assistant',
      timestamp: 'Just now',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getContext = async () => {
    const { data: drawings } = await supabase.from('drawings').select('sheet_name, discipline, current_revision')
    const { data: changes } = await supabase.from('changes').select('description, trade, severity, change_type, created_at').order('created_at', { ascending: false }).limit(20)
    const { data: projects } = await supabase.from('projects').select('name, status')
    const { count: alertCount } = await supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('read', false)

    return JSON.stringify({
      user: user?.name ?? 'Unknown',
      projects: projects ?? [],
      drawings: drawings ?? [],
      recentChanges: changes ?? [],
      unreadAlerts: alertCount ?? 0,
    })
  }

  const handleSend = async () => {
    if (!input.trim() || loading || !GROQ_API_KEY) return

    const userMsg: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const context = await getContext()

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are Alterect AI, a construction drawing assistant. You have access to the user's project data in JSON below. Answer questions about drawings, changes, trades, and alerts based ONLY on this data. If there's no data, say so. Be concise and specific. Never make up data.\n\nCurrent account data:\n${context}`,
            },
            { role: 'user', content: input },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }

      const json = await res.json()
      const reply = json.choices?.[0]?.message?.content ?? "I couldn't process that request."

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: reply,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble reaching the AI. Your API key may need to be configured.',
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, fallback])
    }

    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-ink text-white rounded-full shadow-subtle flex items-center justify-center hover:bg-ink/90 transition-all z-50"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 right-6 w-[420px] h-[600px] bg-fog rounded-[24px] shadow-subtle border border-dove/10 flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 bg-white border-b border-dove/10 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} strokeWidth={1.5} className="text-ink" />
                <span className="text-body font-[450] text-ink">Ask Alterect AI</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} content={msg.content} role={msg.role} timestamp={msg.timestamp} />
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-[20px] p-4 shadow-subtle border border-dove/10">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-dove rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-dove rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-dove rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-dove/10 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about any drawing change..."
                  className="flex-1 px-4 py-3 bg-fog rounded-[16px] text-body text-ink placeholder:text-graphite/60 focus:outline-none focus:ring-2 focus:ring-ink/10 border border-dove/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || !GROQ_API_KEY}
                  className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center shrink-0 hover:bg-ink/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
