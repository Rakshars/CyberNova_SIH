import { useState, useEffect } from 'react'
import { scanPhishingUrl, scanScamMessage, scanDeepfakeMedia } from '../api'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function MultiModal() {
  const [activeTab, setActiveTab] = useState('phishing')

  const [urlInput, setUrlInput] = useState('http://login-verify-bank.com.xyz/update-kyc')
  const [phishingResult, setPhishingResult] = useState(null)
  const [phishingLoading, setPhishingLoading] = useState(false)

  const [scamText, setScamText] = useState('URGENT: Your Electricity power will be disconnected tonight at 9:30 PM due to pending bill. Immediately call Cyber Support Officer at +91-9876543210 or update KYC at http://bit.ly/power-bill-pay')
  const [scamChannel, setScamChannel] = useState('SMS')
  const [scamResult, setScamResult] = useState(null)
  const [scamLoading, setScamLoading] = useState(false)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [deepfakeResult, setDeepfakeResult] = useState(null)
  const [deepfakeLoading, setDeepfakeLoading] = useState(false)

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const handleScanUrl = async (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    setPhishingLoading(true)
    try { setPhishingResult(await scanPhishingUrl(urlInput)) }
    catch (err) { alert(err.message) }
    finally { setPhishingLoading(false) }
  }

  const handleScanScam = async (e) => {
    e.preventDefault()
    if (!scamText.trim()) return
    setScamLoading(true)
    try { setScamResult(await scanScamMessage(scamText, scamChannel)) }
    catch (err) { alert(err.message) }
    finally { setScamLoading(false) }
  }

  const handleDeepfakeUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setDeepfakeLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      setDeepfakeResult(await scanDeepfakeMedia(fd))
    } catch (err) { alert(err.message) }
    finally { setDeepfakeLoading(false) }
  }

  const TABS = [
    { id: 'phishing', label: 'Phishing URL' },
    { id: 'scam',     label: 'Scam Message' },
    { id: 'deepfake', label: 'Deepfake Media' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Security Scanner</h1>
        <p>Analyze URLs, messages, and media for phishing, scam patterns, and deepfake manipulation.</p>
      </div>

      <div className="filters" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} className={`toggle-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'phishing' && (
        <div className="card">
          <div className="section-title">Phishing URL Inspector</div>
          <form onSubmit={handleScanUrl} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Enter URL to inspect…"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={phishingLoading}>
              {phishingLoading ? 'Scanning…' : 'Scan'}
            </button>
          </form>
          {phishingResult && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Result</span>
                <span className={`badge badge-${phishingResult.severity.toLowerCase()}`}>
                  {phishingResult.verdict} — Risk {phishingResult.risk_score}/100
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                Domain entropy: <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--text)' }}>{phishingResult.domain_entropy}</code>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Risk signals:</div>
              <ul style={{ paddingLeft: 18, color: 'var(--red)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {phishingResult.risk_factors.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'scam' && (
        <div className="card">
          <div className="section-title">Scam Message Classifier</div>
          <form onSubmit={handleScanScam} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <select className="form-select" style={{ maxWidth: 200 }} value={scamChannel} onChange={e => setScamChannel(e.target.value)}>
              <option value="SMS">SMS</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="UPI">UPI Note</option>
            </select>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Paste message to analyze…"
              value={scamText}
              onChange={e => setScamText(e.target.value)}
            />
            <div>
              <button type="submit" className="btn btn-primary" disabled={scamLoading}>
                {scamLoading ? 'Analyzing…' : 'Analyze message'}
              </button>
            </div>
          </form>
          {scamResult && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Classification</span>
                <span className={`badge badge-${scamResult.severity.toLowerCase()}`}>
                  {scamResult.verdict} — {scamResult.scam_confidence}% confidence
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Detected triggers:</div>
              <ul style={{ paddingLeft: 18, color: 'var(--orange)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {scamResult.detected_triggers.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'deepfake' && (
        <div className="card">
          <div className="section-title">Deepfake Media Scanner</div>
          <form onSubmit={handleDeepfakeUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div style={{
              border: '1px dashed var(--border)',
              borderRadius: 'var(--r)',
              padding: '20px 16px',
              background: 'var(--surface-2)',
              textAlign: 'center'
            }}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={e => {
                  const selected = e.target.files[0] || null
                  setFile(selected)
                  setDeepfakeResult(null)
                  setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return selected ? URL.createObjectURL(selected) : null })
                }}
                style={{ cursor: 'pointer' }}
              />
              <p style={{ marginTop: 8, color: 'var(--text-3)', fontSize: 11 }}>Upload an image or video to analyze for synthetic manipulation</p>
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={!file || deepfakeLoading}>
                {deepfakeLoading ? 'Analyzing…' : 'Analyze media'}
              </button>
            </div>
          </form>

          {previewUrl && (
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', marginBottom: 16 }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{ display: 'block', maxWidth: '100%', maxHeight: 320, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}
              />
              {deepfakeResult?.heatmap_regions?.[0] && (
                <div style={{
                  position: 'absolute',
                  left: deepfakeResult.heatmap_regions[0].x,
                  top: deepfakeResult.heatmap_regions[0].y,
                  width: deepfakeResult.heatmap_regions[0].width,
                  height: deepfakeResult.heatmap_regions[0].height,
                  border: '2px solid var(--red)',
                  borderRadius: 4,
                  pointerEvents: 'none'
                }} />
              )}
            </div>
          )}

          {deepfakeResult && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{deepfakeResult.filename}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Frames analyzed: {deepfakeResult.frame_count_analyzed}</div>
                </div>
                <span className={`badge badge-${deepfakeResult.deepfake_probability > 70 ? 'critical' : 'low'}`}>
                  {deepfakeResult.verdict} — {deepfakeResult.deepfake_probability}%
                </span>
              </div>
              {deepfakeResult.anomalies_detected.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Detected anomalies:</div>
                  <ul style={{ paddingLeft: 18, color: 'var(--red)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
                    {deepfakeResult.anomalies_detected.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </>
              )}
              {deepfakeResult.heatmap_regions.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Artifact regions:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {deepfakeResult.heatmap_regions.map((h, i) => (
                      <div key={i} style={{ background: 'var(--surface)', padding: '6px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 11 }}>
                        <span style={{ fontWeight: 600, color: 'var(--red)' }}>{h.region}</span>
                        <div style={{ color: 'var(--text-2)' }}>Severity: {h.risk}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
