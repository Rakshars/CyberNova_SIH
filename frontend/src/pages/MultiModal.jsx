import React, { useState, useEffect } from 'react'
import { scanPhishingUrl, scanScamMessage, scanDeepfakeMedia } from '../api'

export default function MultiModal() {
  const [activeTab, setActiveTab] = useState('phishing') // 'phishing' | 'scam' | 'deepfake'

  // Phishing state
  const [urlInput, setUrlInput] = useState('http://login-verify-bank.com.xyz/update-kyc')
  const [phishingResult, setPhishingResult] = useState(null)
  const [phishingLoading, setPhishingLoading] = useState(false)

  // Scam text state
  const [scamText, setScamText] = useState('URGENT: Your Electricity power will be disconnected tonight at 9:30 PM due to pending bill. Immediately call Cyber Support Officer at +91-9876543210 or update KYC at http://bit.ly/power-bill-pay')
  const [scamChannel, setScamChannel] = useState('SMS')
  const [scamResult, setScamResult] = useState(null)
  const [scamLoading, setScamLoading] = useState(false)

  // Deepfake state
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [deepfakeResult, setDeepfakeResult] = useState(null)
  const [deepfakeLoading, setDeepfakeLoading] = useState(false)

  // Revoke the preview blob URL whenever it changes or the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleScanUrl = async (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    setPhishingLoading(true)
    try {
      const res = await scanPhishingUrl(urlInput)
      setPhishingResult(res)
    } catch (err) {
      alert(`Error scanning URL: ${err.message}`)
    } finally {
      setPhishingLoading(false)
    }
  }

  const handleScanScam = async (e) => {
    e.preventDefault()
    if (!scamText.trim()) return
    setScamLoading(true)
    try {
      const res = await scanScamMessage(scamText, scamChannel)
      setScamResult(res)
    } catch (err) {
      alert(`Error scanning message: ${err.message}`)
    } finally {
      setScamLoading(false)
    }
  }

  const handleDeepfakeUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setDeepfakeLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await scanDeepfakeMedia(formData)
      setDeepfakeResult(res)
    } catch (err) {
      alert(`Error analyzing file: ${err.message}`)
    } finally {
      setDeepfakeLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🛡️ Multi-Modal Security Hub</h1>
        <p>AI-Powered verification for Phishing Domains, SMS/Email Scams, and Synthetic Deepfake Media</p>
      </div>

      {/* Tabs Header */}
      <div className="filters" style={{ marginBottom: '20px' }}>
        <button
          className={`toggle-btn ${activeTab === 'phishing' ? 'active' : ''}`}
          onClick={() => setActiveTab('phishing')}
        >
          🌐 Phishing URL Inspector
        </button>
        <button
          className={`toggle-btn ${activeTab === 'scam' ? 'active' : ''}`}
          onClick={() => setActiveTab('scam')}
        >
          📱 Email & SMS Scam Classifier
        </button>
        <button
          className={`toggle-btn ${activeTab === 'deepfake' ? 'active' : ''}`}
          onClick={() => setActiveTab('deepfake')}
        >
          🎭 Deepfake Video/Image Scanner
        </button>
      </div>

      {/* 1. Phishing Tab */}
      {activeTab === 'phishing' && (
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Check Domain & URL Safety</h2>
          <form onSubmit={handleScanUrl} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              className="filter-input"
              style={{ flex: 1 }}
              placeholder="Enter suspect URL (e.g. http://login-verify-bank.com)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={phishingLoading}>
              {phishingLoading ? 'Scanning...' : 'Scan URL'}
            </button>
          </form>

          {phishingResult && (
            <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-sub)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600 }}>Analysis Verdict:</span>
                <span className={`badge badge-${phishingResult.severity.toLowerCase()}`}>
                  {phishingResult.verdict} ({phishingResult.risk_score}/100 Risk Score)
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '10px' }}>
                Domain Entropy: <code>{phishingResult.domain_entropy}</code>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Detected Risk Signals:</div>
              <ul style={{ paddingLeft: '20px', color: 'var(--critical)', fontSize: '12px' }}>
                {phishingResult.risk_factors.map((f, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. Scam Text Tab */}
      {activeTab === 'scam' && (
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Scan Email, SMS, or WhatsApp Message for Scam Patterns</h2>
          <form onSubmit={handleScanScam} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="filter-select" value={scamChannel} onChange={(e) => setScamChannel(e.target.value)}>
                <option value="SMS">SMS Message</option>
                <option value="Email">Email Payload</option>
                <option value="WhatsApp">WhatsApp Alert</option>
                <option value="UPI">UPI Note</option>
              </select>
            </div>
            <textarea
              className="feedback-textarea"
              rows={4}
              placeholder="Paste message body to analyze..."
              value={scamText}
              onChange={(e) => setScamText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={scamLoading}>
              {scamLoading ? 'Analyzing Text...' : 'Analyze Message'}
            </button>
          </form>

          {scamResult && (
            <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-sub)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600 }}>Scam Classification:</span>
                <span className={`badge badge-${scamResult.severity.toLowerCase()}`}>
                  {scamResult.verdict} ({scamResult.scam_confidence}% Confidence)
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Urgency & Scam Triggers Found:</div>
              <ul style={{ paddingLeft: '20px', color: 'var(--high)', fontSize: '12px' }}>
                {scamResult.detected_triggers.map((t, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3. Deepfake Scanner Tab */}
      {activeTab === 'deepfake' && (
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Deepfake Image & Video AI Forensics</h2>
          <form onSubmit={handleDeepfakeUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div style={{ border: '2px dashed var(--border)', padding: '24px', borderRadius: 'var(--radius)', textAlign: 'center', background: 'var(--surface-2)' }}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const selected = e.target.files[0] || null
                  setFile(selected)
                  setDeepfakeResult(null)
                  setPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return selected ? URL.createObjectURL(selected) : null
                  })
                }}
                style={{ cursor: 'pointer' }}
              />
              <p style={{ marginTop: '8px', color: 'var(--text-sub)', fontSize: '12px' }}>Upload suspect video or photo to run facial artifact & GAN manipulation heatmaps</p>
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={!file || deepfakeLoading}>
              {deepfakeLoading ? 'Analyzing Frame Vectors...' : 'Analyze Media File'}
            </button>
          </form>

          {previewUrl && (
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', marginBottom: '20px' }}>
              <img
                src={previewUrl}
                alt="Uploaded media preview"
                style={{ display: 'block', maxWidth: '100%', maxHeight: '360px', borderRadius: 'var(--radius)', border: '1px solid var(--border-sub)' }}
              />
              {deepfakeResult?.heatmap_regions?.[0] && (
                <div
                  style={{
                    position: 'absolute',
                    left: deepfakeResult.heatmap_regions[0].x,
                    top: deepfakeResult.heatmap_regions[0].y,
                    width: deepfakeResult.heatmap_regions[0].width,
                    height: deepfakeResult.heatmap_regions[0].height,
                    border: '2px solid var(--critical)',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )}

          {deepfakeResult && (
            <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-sub)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>{deepfakeResult.filename}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Frames Analyzed: {deepfakeResult.frame_count_analyzed}</span>
                </div>
                <span className={`badge badge-${deepfakeResult.deepfake_probability > 70 ? 'critical' : 'low'}`}>
                  {deepfakeResult.verdict} ({deepfakeResult.deepfake_probability}% Probability)
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Detected Artifact Anomalies:</div>
                <ul style={{ paddingLeft: '20px', color: 'var(--critical)', fontSize: '12px' }}>
                  {deepfakeResult.anomalies_detected.map((a, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{a}</li>
                  ))}
                </ul>
              </div>

              {deepfakeResult.heatmap_regions.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Facial Artifact Heatmap Regions:</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {deepfakeResult.heatmap_regions.map((h, i) => (
                      <div key={i} style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--critical-bg)', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--critical)' }}>{h.region}</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Severity: {h.risk} ({h.x}, {h.y})</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
