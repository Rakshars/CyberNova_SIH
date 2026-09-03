import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { queryCopilot } from '../api'
import { X, Send, Bot, Zap } from 'lucide-react'

export default function CopilotDrawer({ isOpen, onClose }) {
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: '**Hello, Analyst.** I\'m the CyberNova AI Sentinel.\n\nAsk me about live threats, UPI fraud anomalies, SOAR playbooks, or deepfake scans.',
      actions: ['Explain High Threats', 'UPI Fraud Summary', 'Show SOAR Actions']
    }
  ])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!isOpen) return null

  const handleSend = async (textToSend) => {
    const prompt = textToSend || query
    if (!prompt.trim()) return
    setMessages(prev => [...prev, { sender: 'user', text: prompt }])
    if (!textToSend) setQuery('')
    setLoading(true)
    try {
      const res = await queryCopilot(prompt)
      setMessages(prev => [...prev, { sender: 'copilot', text: res.response, actions: res.suggested_actions || [] }])
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'copilot', text: `⚠️ Error fetching AI response: ${err.message}`, actions: [] }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0,
      width: 420, height: '100vh',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface-2)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--r-sm)',
            background: 'var(--blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>AI Sentinel Copilot</div>
            <div style={{ fontSize: 10, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              Online · Autonomous SOC Assistant
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ color: 'var(--text-3)', display: 'flex', padding: 4, borderRadius: 4, transition: 'color var(--t)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '88%',
          }}>
            <div style={{
              background: m.sender === 'user' ? 'var(--blue)' : 'var(--surface-2)',
              color: m.sender === 'user' ? '#fff' : 'var(--text)',
              padding: '10px 13px',
              borderRadius: m.sender === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              fontSize: 13,
              lineHeight: 1.6,
              border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
            }}>
              {m.sender === 'user' ? (
                m.text
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ margin: '0 0 6px 0', lineHeight: 1.5 }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ margin: '4px 0 6px 0', paddingLeft: 18, listStyleType: 'disc' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ margin: '4px 0 6px 0', paddingLeft: 18 }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: 4, lineHeight: 1.4 }}>{children}</li>,
                  }}
                >
                  {m.text?.replace(/• /g, '- ')}
                </ReactMarkdown>
              )}
            </div>
            {m.actions?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {m.actions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(act)}
                    style={{
                      background: 'var(--blue-dim)',
                      color: 'var(--blue-light)',
                      border: '1px solid var(--blue-border)',
                      borderRadius: 'var(--r-sm)',
                      padding: '3px 9px',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: 'inherit'
                    }}
                  >
                    <Zap size={10} /> {act}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ color: 'var(--text-3)', fontSize: 12, fontStyle: 'italic', alignSelf: 'flex-start' }}>
            Analyzing security telemetry…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0 }}>
        <form onSubmit={e => { e.preventDefault(); handleSend() }} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Ask about threats, SOAR, UPI fraud…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)',
              padding: '8px 12px',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color var(--t)'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '8px 12px' }}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}
