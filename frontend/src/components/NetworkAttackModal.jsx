import React, { useEffect, useState } from 'react'
import { getUsers } from '../api'

export default function NetworkAttackModal({ attackInfo, onClose }) {
  const [stage, setStage] = useState(1) // 1: Infiltration, 2: Lateral Spreading, 3: CyberNova Intercept, 4: SOAR Contained
  const [userList, setUserList] = useState([])

  useEffect(() => {
    getUsers({ page_size: 6 }).then(data => {
      if (data && data.items) {
        setUserList(data.items.map(u => u.username))
      }
    }).catch(() => {
      setUserList(['asha', 'vikram', 'priya', 'rahul', 'dev_admin'])
    })
  }, [])

  useEffect(() => {
    if (!attackInfo) return

    // Stage 1: Infiltration to Target PC (1.4s)
    const t1 = setTimeout(() => setStage(2), 1600)
    // Stage 2: Lateral Spreading across office LAN (3.4s)
    const t2 = setTimeout(() => setStage(3), 3600)
    // Stage 3: CyberNova AI Shield Intercept & Isolation (5.4s)
    const t3 = setTimeout(() => setStage(4), 5600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [attackInfo])

  if (!attackInfo) return null

  const targetUsername = attackInfo.target_user || 'asha'
  const officeUsers = userList.length > 0 ? userList : ['asha', 'vikram', 'priya', 'rahul', 'dev_admin']

  // Canvas Node Positions
  const nodes = [
    { id: 'attacker', label: 'External Attacker', role: attackInfo.attacker_ip || '185.220.140.197', x: 80, y: 190, type: 'attacker' },
    { id: 'switch', label: 'Office LAN Core Switch', role: 'Subnet 192.168.1.0/24', x: 260, y: 190, type: 'infrastructure' },
    { id: 'soar', label: 'CyberNova SOAR Shield', role: 'AI Autonomous Engine', x: 260, y: 340, type: 'shield' },
  ]

  // Balanced user workstation positions with plenty of bottom padding
  const userPositions = [
    { x: 490, y: 65 },
    { x: 710, y: 65 },
    { x: 490, y: 190 },
    { x: 710, y: 190 },
    { x: 600, y: 315 },
  ]

  officeUsers.forEach((uname, idx) => {
    const pos = userPositions[idx % userPositions.length]
    const isTarget = uname.toLowerCase() === targetUsername.toLowerCase()
    nodes.push({
      id: `user_${uname}`,
      label: `${uname}'s PC`,
      role: isTarget ? 'Primary Target' : 'Office Coworker',
      x: pos.x,
      y: pos.y,
      type: isTarget ? 'target' : 'user',
      username: uname
    })
  })

  // Find exact target node coordinates dynamically!
  const targetNode = nodes.find(n => n.username?.toLowerCase() === targetUsername.toLowerCase()) || nodes.find(n => n.type === 'target') || { x: 490, y: 190 }
  const coworkerNodes = nodes.filter(n => n.type === 'user' && !n.username?.toLowerCase().includes(targetUsername.toLowerCase()))

  // Network Edges (Connections)
  const edges = [
    { from: 'attacker', to: 'switch', id: 'e_attack' },
    { from: 'soar', to: 'switch', id: 'e_soar' },
  ]

  officeUsers.forEach((uname) => {
    edges.push({ from: 'switch', to: `user_${uname}`, id: `e_sw_${uname}` })
  })

  // Interconnect office user workstations to show lateral LAN mesh
  if (officeUsers.length >= 2) {
    for (let i = 0; i < officeUsers.length - 1; i++) {
      edges.push({
        from: `user_${officeUsers[i]}`,
        to: `user_${officeUsers[i + 1]}`,
        id: `e_mesh_${i}`
      })
    }
  }

  const getNodeColor = (node) => {
    if (node.id === 'attacker') return '#ff2a6d'
    if (node.id === 'soar') return '#00f2fe'
    if (node.id === 'switch') return stage >= 3 ? '#00f2fe' : '#3b82f6'

    const isTarget = node.username?.toLowerCase() === targetUsername.toLowerCase()

    if (stage === 1) {
      if (isTarget) return '#ffaa00'
      return '#05ffa1'
    }
    if (stage === 2) {
      if (isTarget) return '#ff2a6d'
      return '#ffaa00' // Coworkers exposed to lateral infection!
    }
    if (stage === 3) {
      if (isTarget) return '#ffaa00'
      return '#00f2fe'
    }
    // Stage 4: Contained & Protected
    if (isTarget) return '#ff2a6d' // Target is Isolated
    return '#05ffa1' // All other office users protected!
  }

  const getEdgeStyle = (edge) => {
    const isAttackerLine = edge.from === 'attacker'
    const isSoarLine = edge.from === 'soar'
    const isMeshLine = edge.id.startsWith('e_mesh')

    if (stage === 1) {
      if (isAttackerLine) return { stroke: '#ffaa00', strokeWidth: 3, strokeDasharray: '6', animation: 'dash 1s linear infinite' }
      return { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 }
    }
    if (stage === 2) {
      if (isAttackerLine || isMeshLine) return { stroke: '#ff2a6d', strokeWidth: 3, strokeDasharray: '5', animation: 'dash 0.5s linear infinite' }
      return { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2 }
    }
    if (stage === 3) {
      if (isSoarLine) return { stroke: '#00f2fe', strokeWidth: 4, strokeDasharray: '4', animation: 'dash 0.4s linear infinite' }
      return { stroke: '#ffaa00', strokeWidth: 2, opacity: 0.6 }
    }
    // Stage 4: SOAR Cut-off Lockdown
    if (isAttackerLine || isMeshLine) return { stroke: '#ff2a6d', strokeWidth: 2, strokeDasharray: '4 4', opacity: 0.3 }
    if (isSoarLine) return { stroke: '#05ffa1', strokeWidth: 3.5 }
    return { stroke: '#05ffa1', strokeWidth: 2, opacity: 0.8 }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(3, 7, 18, 0.95)',
      backdropFilter: 'blur(20px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        maxHeight: '94vh',
        overflowY: 'auto',
        background: '#0b0f19',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(0, 242, 254, 0.2)',
        position: 'relative',
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 30
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{
              background: stage === 4 ? 'var(--low-bg)' : 'var(--critical-bg)',
              color: stage === 4 ? 'var(--low)' : 'var(--critical)',
              border: `1px solid ${stage === 4 ? 'var(--low)' : 'var(--critical)'}`,
              padding: '3px 12px',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              {stage === 1 && `🚨 STAGE 1: INFILTRATING ${targetUsername.toUpperCase()}'S WORKSTATION`}
              {stage === 2 && '⚡ STAGE 2: LATERAL THREAT SPREAD ACROSS OFFICE LAN'}
              {stage === 3 && '🤖 STAGE 3: CYBERNOVA ZERO-TRUST INTERCEPT'}
              {stage === 4 && '🔒 STAGE 4: AUTONOMOUS SOAR ISOLATION COMPLETE'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-sub)', fontFamily: "'JetBrains Mono', monospace" }}>
              Target: {targetUsername}'s PC ({targetNode.x}px, {targetNode.y}px)
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
            Multi-User Office Network Mesh &amp; Threat Spread Visualizer
          </h2>
        </div>

        {/* Stage Progress Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { step: 1, title: '1. Infiltration' },
            { step: 2, title: '2. Lateral LAN Spread' },
            { step: 3, title: '3. AI Intercept' },
            { step: 4, title: '4. SOAR Isolation' },
          ].map(s => (
            <div key={s.step} style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: stage >= s.step ? (s.step === 4 ? 'rgba(5, 255, 161, 0.15)' : 'rgba(0, 242, 254, 0.15)') : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${stage >= s.step ? (s.step === 4 ? 'var(--low)' : 'var(--accent)') : 'rgba(255,255,255,0.1)'}`,
              color: stage >= s.step ? '#fff' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              {s.title}
            </div>
          ))}
        </div>

        {/* SVG Mesh Canvas */}
        <div style={{
          width: '100%',
          height: '420px',
          background: 'radial-gradient(circle at 50% 50%, rgba(17, 24, 39, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>

          {/* Dynamic CSS Keyframes for Skull & Shield Trajectory */}
          <style>{`
            @keyframes dash {
              to { stroke-dashoffset: -20; }
            }
            @keyframes nodePulse {
              0%, 100% { transform: scale(1.12); box-shadow: 0 0 22px #ff2a6d; }
              50% { transform: scale(1.22); box-shadow: 0 0 32px #ff2a6d; }
            }
            /* Stage 1: Skull travels from Attacker (80,190) -> Switch (260,190) -> EXACT Target Node (${targetNode.x}, ${targetNode.y}) */
            @keyframes attackTrajectory {
              0% { left: 80px; top: 190px; }
              40% { left: 260px; top: 190px; }
              100% { left: ${targetNode.x}px; top: ${targetNode.y}px; }
            }
            /* Stage 2: Lateral Spreading from Target (${targetNode.x}, ${targetNode.y}) to Coworker PC */
            @keyframes lateralSpreadTrajectory {
              0% { left: ${targetNode.x}px; top: ${targetNode.y}px; }
              100% { left: ${coworkerNodes[0]?.x || 710}px; top: ${coworkerNodes[0]?.y || 65}px; }
            }
            /* Stage 3: SOAR Shield (260,340) -> Intercepts line right in front of target */
            @keyframes shieldInterceptTrajectory {
              0% { left: 260px; top: 340px; }
              50% { left: 260px; top: 190px; }
              100% { left: ${(260 + targetNode.x) / 2}px; top: ${(190 + targetNode.y) / 2}px; }
            }
          `}</style>

          {/* SVG Connection Lines */}
          <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from)
              const toNode = nodes.find(n => n.id === edge.to)
              if (!fromNode || !toNode) return null
              const style = getEdgeStyle(edge)
              return (
                <line
                  key={edge.id}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  {...style}
                  style={{ transition: 'all 0.4s ease' }}
                />
              )
            })}
          </svg>

          {/* 💀 Animated Red Threat Packet Moving Directly to Target Machine */}
          {stage === 1 && (
            <div style={{
              position: 'absolute',
              width: '32px',
              height: '32px',
              background: 'radial-gradient(circle, #ff2a6d 0%, rgba(255,42,109,0.3) 100%)',
              border: '2px solid #ff2a6d',
              borderRadius: '50%',
              boxShadow: '0 0 25px #ff2a6d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              zIndex: 25,
              animation: 'attackTrajectory 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }}>
              💀
            </div>
          )}

          {/* ⚡ Stage 2: Lateral Threat Packet Spreading Across Coworkers */}
          {stage === 2 && (
            <div style={{
              position: 'absolute',
              width: '32px',
              height: '32px',
              background: 'radial-gradient(circle, #ffaa00 0%, rgba(255,170,0,0.3) 100%)',
              border: '2px solid #ffaa00',
              borderRadius: '50%',
              boxShadow: '0 0 25px #ffaa00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              zIndex: 25,
              animation: 'lateralSpreadTrajectory 1.4s linear infinite'
            }}>
              💥
            </div>
          )}

          {/* 🛡️ Stage 3 & 4: Animated CyberNova AI Defense Intercept Icon */}
          {(stage === 3 || stage === 4) && (
            <div style={{
              position: 'absolute',
              width: '34px',
              height: '34px',
              background: 'radial-gradient(circle, #00f2fe 0%, rgba(0,242,254,0.3) 100%)',
              border: '2px solid #00f2fe',
              borderRadius: '50%',
              boxShadow: '0 0 30px #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              zIndex: 25,
              animation: stage === 3 ? 'shieldInterceptTrajectory 1.6s ease-in-out infinite' : 'none',
              left: stage === 4 ? `${(260 + targetNode.x) / 2}px` : undefined,
              top: stage === 4 ? `${(190 + targetNode.y) / 2}px` : undefined,
              transform: stage === 4 ? 'translate(-50%, -50%)' : undefined
            }}>
              🤖
            </div>
          )}

          {/* 🛑 Intercept Collision Barrier Badge in Stage 4 */}
          {stage === 4 && (
            <div style={{
              position: 'absolute',
              left: `${(260 + targetNode.x) / 2}px`,
              top: `${(190 + targetNode.y) / 2 - 28}px`,
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, #ff2a6d 0%, #00f2fe 100%)',
              padding: '4px 12px',
              borderRadius: '99px',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 0 20px rgba(0,242,254,0.8)',
              zIndex: 26,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}>
              🛑 THREAT CONTAINED BY CYBERNOVA AI
            </div>
          )}

          {/* Render All Network & User Nodes */}
          {nodes.map(node => {
            const color = getNodeColor(node)
            const isTarget = node.username?.toLowerCase() === targetUsername.toLowerCase()
            const isExposedCoworker = stage === 2 && node.type === 'user' && !isTarget

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 10
                }}
              >
                {/* Node Outer Ring */}
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(11, 15, 25, 0.95)',
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 20px ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.4s ease',
                  transform: (isTarget || isExposedCoworker) ? 'scale(1.15)' : 'scale(1)',
                  animation: (isTarget || isExposedCoworker) ? 'nodePulse 0.8s infinite' : 'none'
                }}>
                  {node.id === 'attacker' && <span style={{ fontSize: '22px' }}>💀</span>}
                  {node.id === 'switch' && <span style={{ fontSize: '22px' }}>🎛️</span>}
                  {node.id === 'soar' && <span style={{ fontSize: '22px' }}>🤖</span>}
                  {node.type === 'target' && <span style={{ fontSize: '22px' }}>💥</span>}
                  {node.type === 'user' && <span style={{ fontSize: '22px' }}>💻</span>}
                </div>

                {/* Node Text Label Card */}
                <div style={{
                  background: 'rgba(11, 15, 25, 0.95)',
                  border: `1px solid ${color}`,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  boxShadow: `0 0 12px ${color}44`
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{node.label}</div>
                  <div style={{ fontSize: '9px', color: color, fontWeight: 700 }}>
                    {stage === 4 && isTarget ? '🔒 ISOLATED BY SOAR' : (stage === 4 && node.type === 'user' ? '🛡️ PROTECTED' : node.role)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Status Footer Bar */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
              {stage === 4 ? `✅ ${targetUsername.toUpperCase()}'S PC ISOLATED — ALL ${officeUsers.length - 1} COWORKERS PROTECTED` : `⚡ Attack Infiltrating ${targetUsername.toUpperCase()}'s Machine`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px' }}>
              Primary Target: <code style={{ color: 'var(--critical)' }}>{targetUsername}'s PC ({targetNode.x}px, {targetNode.y}px)</code> | LAN Switch: <code>192.168.1.1</code>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {stage === 4 ? (
              <button className="btn btn-primary" onClick={onClose} style={{ padding: '8px 20px', fontSize: '13px' }}>
                Done / Return to SOC
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--accent)' }}>
                <span className="status-dot" style={{ background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
                Intercepting Threat Vector…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
