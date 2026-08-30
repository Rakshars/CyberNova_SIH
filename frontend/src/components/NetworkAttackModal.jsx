import React, { useEffect, useState } from 'react'
import { getUsers } from '../api'
import LiveSOARTerminal from './LiveSOARTerminal'

export default function NetworkAttackModal({ attackInfo, onClose }) {
  const [stage, setStage] = useState(1)
  const [userList, setUserList] = useState([])

  useEffect(() => {
    getUsers({ page_size: 6 }).then(data => {
      if (data && data.items) setUserList(data.items.map(u => u.username))
    }).catch(() => {
      setUserList(['asha', 'vikram', 'priya', 'rahul', 'dev_admin'])
    })
  }, [])

  useEffect(() => {
    if (!attackInfo) return
    const t1 = setTimeout(() => setStage(2), 1600)
    const t2 = setTimeout(() => setStage(3), 3600)
    const t3 = setTimeout(() => setStage(4), 5600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [attackInfo])

  if (!attackInfo) return null

  const targetUsername = attackInfo.target_user || 'asha'
  const officeUsers = userList.length > 0 ? userList : ['asha', 'vikram', 'priya', 'rahul', 'dev_admin']

  const nodes = [
    { id: 'attacker', label: 'External Attacker', role: attackInfo.attacker_ip || '185.220.140.197', x: 80,  y: 190, type: 'attacker' },
    { id: 'switch',   label: 'Office LAN Switch',  role: 'Subnet 192.168.1.0/24',                   x: 260, y: 190, type: 'infrastructure' },
    { id: 'soar',     label: 'CyberNova SOAR',      role: 'AI Autonomous Engine',                    x: 260, y: 340, type: 'shield' },
  ]

  const userPositions = [
    { x: 490, y: 65 }, { x: 710, y: 65 },
    { x: 490, y: 190 }, { x: 710, y: 190 },
    { x: 600, y: 315 },
  ]

  officeUsers.forEach((uname, idx) => {
    const pos = userPositions[idx % userPositions.length]
    const isTarget = uname.toLowerCase() === targetUsername.toLowerCase()
    nodes.push({ id: `user_${uname}`, label: `${uname}'s PC`, role: isTarget ? 'Primary Target' : 'Office Coworker', x: pos.x, y: pos.y, type: isTarget ? 'target' : 'user', username: uname })
  })

  const targetNode = nodes.find(n => n.username?.toLowerCase() === targetUsername.toLowerCase()) || { x: 490, y: 190 }
  const coworkerNodes = nodes.filter(n => n.type === 'user')

  const edges = [
    { from: 'attacker', to: 'switch', id: 'e_attack' },
    { from: 'soar',     to: 'switch', id: 'e_soar' },
  ]
  officeUsers.forEach(uname => edges.push({ from: 'switch', to: `user_${uname}`, id: `e_sw_${uname}` }))
  for (let i = 0; i < officeUsers.length - 1; i++) {
    edges.push({ from: `user_${officeUsers[i]}`, to: `user_${officeUsers[i + 1]}`, id: `e_mesh_${i}` })
  }

  const getNodeColor = (node) => {
    if (node.id === 'attacker') return '#e84040'
    if (node.id === 'soar')    return '#3b82f6'
    if (node.id === 'switch')  return stage >= 3 ? '#3b82f6' : '#64748b'
    const isTarget = node.username?.toLowerCase() === targetUsername.toLowerCase()
    if (stage === 1) return isTarget ? '#f97316' : '#22c55e'
    if (stage === 2) return isTarget ? '#e84040' : '#f97316'
    if (stage === 3) return isTarget ? '#f97316' : '#3b82f6'
    return isTarget ? '#e84040' : '#22c55e'
  }

  const getEdgeStyle = (edge) => {
    const isAttackerLine = edge.from === 'attacker'
    const isSoarLine     = edge.from === 'soar'
    const isMeshLine     = edge.id.startsWith('e_mesh')
    if (stage === 1) {
      if (isAttackerLine) return { stroke: '#f97316', strokeWidth: 2.5, strokeDasharray: '6', animation: 'dash 1s linear infinite' }
      return { stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1.5 }
    }
    if (stage === 2) {
      if (isAttackerLine || isMeshLine) return { stroke: '#e84040', strokeWidth: 2.5, strokeDasharray: '5', animation: 'dash 0.5s linear infinite' }
      return { stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1.5 }
    }
    if (stage === 3) {
      if (isSoarLine) return { stroke: '#3b82f6', strokeWidth: 3.5, strokeDasharray: '4', animation: 'dash 0.4s linear infinite' }
      return { stroke: '#f97316', strokeWidth: 1.5, opacity: 0.5 }
    }
    if (isAttackerLine || isMeshLine) return { stroke: '#e84040', strokeWidth: 1.5, strokeDasharray: '4 4', opacity: 0.25 }
    if (isSoarLine) return { stroke: '#22c55e', strokeWidth: 3 }
    return { stroke: '#22c55e', strokeWidth: 1.5, opacity: 0.7 }
  }

  const STAGES = [
    { step: 1, title: '1. Infiltration' },
    { step: 2, title: '2. Lateral Spread' },
    { step: 3, title: '3. AI Intercept' },
    { step: 4, title: '4. SOAR Isolation' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 960, maxHeight: '94vh', overflowY: 'auto',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        animation: 'fadeUp 0.25s ease forwards'
      }}>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-2)', fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 30
          }}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className={`badge ${stage === 4 ? 'badge-low' : 'badge-critical'}`}>
              {stage === 1 && `🚨 STAGE 1: INFILTRATING ${targetUsername.toUpperCase()}'S WORKSTATION`}
              {stage === 2 && '⚡ STAGE 2: LATERAL THREAT SPREAD ACROSS LAN'}
              {stage === 3 && '🤖 STAGE 3: CYBERNOVA ZERO-TRUST INTERCEPT'}
              {stage === 4 && '🔒 STAGE 4: AUTONOMOUS SOAR ISOLATION COMPLETE'}
            </span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Network Mesh — Threat Spread Visualizer
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            Target: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--red)' }}>{targetUsername}</span>
            &nbsp;·&nbsp;Attacker IP: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-3)' }}>{attackInfo.attacker_ip || '185.220.140.197'}</span>
          </div>
        </div>

        {/* Stage Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {STAGES.map(({ step, title }) => (
            <div key={step} style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-sm)',
              background: stage >= step ? (step === 4 ? 'var(--green-dim)' : 'var(--blue-dim)') : 'var(--surface-2)',
              border: `1px solid ${stage >= step ? (step === 4 ? 'var(--green-border)' : 'var(--blue-border)') : 'var(--border)'}`,
              color: stage >= step ? (step === 4 ? 'var(--green)' : 'var(--blue-light)') : 'var(--text-3)',
              fontSize: 11, fontWeight: 700, textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              {title}
            </div>
          ))}
        </div>

        {/* SVG Canvas */}
        <div style={{
          width: '100%', height: 420,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          position: 'relative', overflow: 'hidden',
          marginBottom: 14
        }}>
          <style>{`
            @keyframes dash { to { stroke-dashoffset: -20; } }
            @keyframes nodePulse {
              0%, 100% { box-shadow: 0 0 14px #e84040; }
              50%       { box-shadow: 0 0 26px #e84040; }
            }
            @keyframes attackTrajectory {
              0%   { left: 80px;  top: 190px; }
              40%  { left: 260px; top: 190px; }
              100% { left: ${targetNode.x}px; top: ${targetNode.y}px; }
            }
            @keyframes lateralSpreadTrajectory {
              0%   { left: ${targetNode.x}px; top: ${targetNode.y}px; }
              100% { left: ${coworkerNodes[0]?.x || 710}px; top: ${coworkerNodes[0]?.y || 65}px; }
            }
            @keyframes shieldInterceptTrajectory {
              0%   { left: 260px; top: 340px; }
              50%  { left: 260px; top: 190px; }
              100% { left: ${(260 + targetNode.x) / 2}px; top: ${(190 + targetNode.y) / 2}px; }
            }
          `}</style>

          <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from)
              const toNode   = nodes.find(n => n.id === edge.to)
              if (!fromNode || !toNode) return null
              const s = getEdgeStyle(edge)
              return <line key={edge.id} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} {...s} style={{ transition: 'all 0.4s ease' }} />
            })}
          </svg>

          {/* Stage 1: attack packet */}
          {stage === 1 && (
            <div style={{
              position: 'absolute', width: 30, height: 30, borderRadius: '50%',
              background: 'var(--red-dim)', border: '2px solid var(--red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, zIndex: 25,
              animation: 'attackTrajectory 1.4s cubic-bezier(0.4,0,0.2,1) infinite'
            }}>💀</div>
          )}

          {/* Stage 2: lateral spread packet */}
          {stage === 2 && (
            <div style={{
              position: 'absolute', width: 30, height: 30, borderRadius: '50%',
              background: 'var(--orange-dim)', border: '2px solid var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, zIndex: 25,
              animation: 'lateralSpreadTrajectory 1.4s linear infinite'
            }}>💥</div>
          )}

          {/* Stage 3 & 4: shield intercept */}
          {(stage === 3 || stage === 4) && (
            <div style={{
              position: 'absolute', width: 32, height: 32, borderRadius: '50%',
              background: 'var(--blue-dim)', border: '2px solid var(--blue-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, zIndex: 25,
              animation: stage === 3 ? 'shieldInterceptTrajectory 1.6s ease-in-out infinite' : 'none',
              left: stage === 4 ? `${(260 + targetNode.x) / 2}px` : undefined,
              top:  stage === 4 ? `${(190 + targetNode.y) / 2}px` : undefined,
              transform: stage === 4 ? 'translate(-50%, -50%)' : undefined
            }}>🤖</div>
          )}

          {/* Stage 4: contained badge */}
          {stage === 4 && (
            <div style={{
              position: 'absolute',
              left: `${(260 + targetNode.x) / 2}px`,
              top:  `${(190 + targetNode.y) / 2 - 30}px`,
              transform: 'translate(-50%, -50%)',
              background: 'var(--green-dim)',
              border: '1px solid var(--green-border)',
              padding: '3px 10px', borderRadius: 99,
              color: 'var(--green)', fontSize: 11, fontWeight: 700,
              zIndex: 26, whiteSpace: 'nowrap'
            }}>🛑 THREAT CONTAINED</div>
          )}

          {/* Nodes */}
          {nodes.map(node => {
            const color = getNodeColor(node)
            const isTarget = node.username?.toLowerCase() === targetUsername.toLowerCase()
            const isExposed = stage === 2 && node.type === 'user' && !isTarget
            return (
              <div key={node.id} style={{
                position: 'absolute',
                left: `${node.x}px`, top: `${node.y}px`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                zIndex: 10
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'var(--surface)',
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 12px ${color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.4s ease',
                  transform: (isTarget || isExposed) ? 'scale(1.15)' : 'scale(1)',
                  animation: (isTarget || isExposed) ? 'nodePulse 0.8s infinite' : 'none'
                }}>
                  {node.id === 'attacker' && <span style={{ fontSize: 20 }}>💀</span>}
                  {node.id === 'switch'   && <span style={{ fontSize: 20 }}>🎛️</span>}
                  {node.id === 'soar'     && <span style={{ fontSize: 20 }}>🤖</span>}
                  {node.type === 'target' && <span style={{ fontSize: 20 }}>💥</span>}
                  {node.type === 'user'   && <span style={{ fontSize: 20 }}>💻</span>}
                </div>
                <div style={{
                  background: 'var(--surface)',
                  border: `1px solid ${color}`,
                  padding: '3px 8px', borderRadius: 5, textAlign: 'center'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{node.label}</div>
                  <div style={{ fontSize: 9, color, fontWeight: 600 }}>
                    {stage === 4 && isTarget ? '🔒 ISOLATED' : stage === 4 && node.type === 'user' ? '🛡️ PROTECTED' : node.role}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Live Backend Process Trace Log Terminal */}
        <div style={{ marginBottom: 14 }}>
          <LiveSOARTerminal activeTrace={attackInfo} height={180} />
        </div>

        {/* Footer */}
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {stage === 4
                ? `✅ ${targetUsername.toUpperCase()}'S PC ISOLATED — ${officeUsers.length - 1} COWORKERS PROTECTED`
                : `⚡ Attack targeting ${targetUsername}'s machine…`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Incident: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>{attackInfo.incident?.title || '—'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {attackInfo.actions?.length > 0 && (
              <span className="badge badge-low">{attackInfo.actions.length} SOAR actions executed</span>
            )}
            {stage === 4 ? (
              <button className="btn btn-primary btn-sm" onClick={onClose}>Done / Return to SOC</button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--blue-light)' }}>
                <span className="status-dot" style={{ background: 'var(--blue-light)' }} />
                Intercepting threat vector…
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
