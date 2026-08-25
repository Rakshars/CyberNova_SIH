import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { queryCopilot } from '../api'

export default function CopilotDrawer({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: '🤖 **Hello Analyst! I am CyberNova Sentinel.**\nAsk me anything about live threats, UPI fraud anomalies, SOAR playbooks, or deepfake scans.',
      actions: ['Explain High Threats', 'UPI Fraud Summary', 'Show SOAR Actions']
    }
  ])
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSend = async (textToSend) => {
    const prompt = textToSend || query
    if (!prompt.trim()) return

    const userMsg = { sender: 'user', text: prompt }
    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setQuery('')
    setLoading(true)

    try {
      const res = await queryCopilot(prompt)
      const botMsg = {
        sender: 'copilot',
        text: res.response,
        actions: res.suggested_actions || []
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'copilot', text: `⚠️ Error fetching AI response: ${err.message}`, actions: [] }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '420px',
      height: '100vh',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-sub)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>CyberNova Sentinel</div>
            <div style={{ fontSize: '11px', color: 'var(--low)' }}>● Autonomous AI SOC Assistant</div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: '18px', padding: '4px' }}>✕</button>
      </div>

      {/* Message Chat List */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '90%',
            background: m.sender === 'user' ? 'var(--accent-dim)' : 'var(--surface-2)',
            color: m.sender === 'user' ? 'var(--accent)' : 'var(--text)',
            padding: '12px 14px',
            borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            fontSize: '13px',
            lineHeight: '1.5',
            border: m.sender === 'user' ? '1px solid var(--accent)' : '1px solid var(--border-sub)'
          }}>
            {m.sender === 'user' ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}

            {/* Suggested Chip Actions */}
            {m.actions && m.actions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {m.actions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(act)}
                    style={{
                      background: 'var(--accent-dim)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)',
                      borderRadius: '12px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}
                  >
                    ⚡ {act}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ color: 'var(--text-sub)', fontSize: '12px', fontStyle: 'italic' }}>
            Thinking & analyzing security telemetry...
          </div>
        )}
      </div>

      {/* Input box */}
      <div style={{ padding: '14px', borderTop: '1px solid var(--border-sub)', background: 'var(--surface-2)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Ask AI Copilot about threats, SOAR, or UPI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              padding: '8px 12px'
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
