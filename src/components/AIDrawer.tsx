import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChatMessage } from '../types'
import { api } from '../lib/api'

const SUGGESTED_QUESTIONS = [
  'Which product has the highest margin?',
  'What are my top products this month?',
  'Where are my biggest margin leaks?',
  'What trends do you see in the last 30 days?',
  'Which customers generate the most profit?',
  'What should I focus on to grow revenue?',
]

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: `Welcome to **Streamline AI**! I'm your business intelligence assistant, connected to your live data.\n\nAsk me anything about your revenue, products, customers, or trends — I'll give you direct, data-backed answers with calculations and specific names.\n\n*Try one of the suggested questions below to get started.*`,
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function AIDrawer({ open, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setError(null)
    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const { reply } = await api.chat(nextMessages)
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s', zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: '#fff', boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 2a10 10 0 00-7.35 16.83L4 22l3.17-.65A10 10 0 1012 2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Ask Streamline AI</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Powered by Claude</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={bottomRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' ? '#0D9488' : '#F8FAFC',
                color: msg.role === 'user' ? '#fff' : '#1E293B',
                border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                fontSize: 13.5, lineHeight: 1.65,
              }}>
                <div style={{ color: msg.role === 'user' ? '#fff' : undefined }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: msg.role === 'assistant' ? '#94A3B8' : 'rgba(255,255,255,0.8)', fontSize: '0.9em' }}>{children}</em>,
                      ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ul>,
                      li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 5, padding: '12px 14px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#0D9488',
                  animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out`,
                }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}
        </div>

        {/* Suggested questions */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Suggested
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={loading}
                style={{
                  padding: '5px 10px', borderRadius: 20, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#475569', fontSize: 12, cursor: loading ? 'default' : 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!loading) { const el = e.currentTarget as HTMLElement; el.style.background = '#F0FDFA'; el.style.borderColor = '#5EEAD4'; el.style.color = '#0D9488' } }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#E2E8F0'; el.style.color = '#475569' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your data…"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 6, border: '1px solid #E2E8F0',
              fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0F172A',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = '#0D9488' }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              padding: '9px 14px', borderRadius: 6, border: 'none',
              background: input.trim() && !loading ? '#0D9488' : '#E2E8F0',
              color: input.trim() && !loading ? '#fff' : '#94A3B8',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
