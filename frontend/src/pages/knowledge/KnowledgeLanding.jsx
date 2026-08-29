import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, BookOpen, ShieldAlert, Bug, AlertTriangle, ShieldCheck, Network, Cpu, ArrowRight } from 'lucide-react'
import { categoriesList, articles } from '../../data/mockKnowledge'

const CATEGORY_ICONS = {
  "attacks-threats": <ShieldAlert size={24} className="category-icon-style" style={{ color: 'var(--critical)' }} />,
  "malware": <Bug size={24} className="category-icon-style" style={{ color: 'var(--high)' }} />,
  "vulnerabilities": <AlertTriangle size={24} className="category-icon-style" style={{ color: 'var(--medium)' }} />,
  "defense-security": <ShieldCheck size={24} className="category-icon-style" style={{ color: 'var(--low)' }} />,
  "networking": <Network size={24} className="category-icon-style" style={{ color: 'var(--accent)' }} />,
  "mitre-attack": <Cpu size={24} className="category-icon-style" style={{ color: 'var(--purple)' }} />
}

export default function KnowledgeLanding() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    navigate(`/knowledge/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const featuredSlugs = ['ransomware', 'phishing', 'lateral-movement', 'command-and-control', 'zero-trust', 'edr']
  const featuredArticles = articles.filter(a => featuredSlugs.includes(a.slug))

  const popularArticles = articles.slice(0, 10) // Show a list of popular articles

  const getDifficultyBadgeClass = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'badge-low'
      case 'intermediate': return 'badge-medium'
      case 'advanced': return 'badge-critical'
      default: return 'badge-neutral'
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 🚀 Header & Search Banner */}
      <div 
        className="card" 
        style={{ 
          marginBottom: 32, 
          padding: '40px 30px', 
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(255, 42, 109, 0.03) 100%)', 
          border: '1px solid rgba(0, 242, 254, 0.25)', 
          boxShadow: '0 0 35px rgba(0, 242, 254, 0.08)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            📖 Cyber Knowledge Base
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '15px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
            Explore cybersecurity concepts, attacks, vulnerabilities, defenses, and threat intelligence. Learn tactical attacker methodologies and defensive mitigation controls.
          </p>
        </div>

        {/* Big Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search 
              size={18} 
              color="var(--text-sub)" 
              style={{ position: 'absolute', left: 16, pointerEvents: 'none' }} 
            />
            <input
              type="text"
              className="filter-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cybersecurity topics..."
              style={{
                width: '100%',
                padding: '14px 90px 14px 46px',
                fontSize: '15px',
                borderRadius: '12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
            <button 
              type="submit"
              className="btn btn-primary"
              style={{
                position: 'absolute',
                right: 8,
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Search Terms */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 16, fontSize: '12px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Quick terms:</span>
          {['Ransomware', 'Phishing', 'Lateral Movement', 'MITRE ATT&CK', 'SQL Injection', 'Zero Trust'].map(term => (
            <button
              key={term}
              type="button"
              onClick={() => navigate(`/knowledge/search?q=${encodeURIComponent(term)}`)}
              style={{
                color: 'var(--accent)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
                textDecorationStyle: 'dotted'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* 📚 Category Cards Section */}
      <div style={{ marginBottom: 40 }}>
        <h2 className="section-title" style={{ fontSize: '15px', marginBottom: 16 }}>📁 Cybersecurity Subject Categories</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 16
        }}>
          {categoriesList.map(cat => {
            const articleCount = articles.filter(a => a.category.toLowerCase() === cat.name.toLowerCase()).length;
            return (
              <div 
                key={cat.id} 
                className="card"
                onClick={() => navigate(`/knowledge/category/${cat.id}`)}
                style={{
                  display: 'flex',
                  gap: 16,
                  cursor: 'pointer',
                  padding: 20,
                  alignItems: 'flex-start',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-sub)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {CATEGORY_ICONS[cat.id]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{cat.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                      {articleCount} {articleCount === 1 ? 'Topic' : 'Topics'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-sub)', fontSize: '12px', marginTop: 4, lineHeight: '1.4' }}>
                    {cat.description}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {cat.examples.map(ex => (
                      <span key={ex} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🌟 Featured Topics Grid */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title" style={{ fontSize: '15px', margin: 0 }}>⭐ Featured Core Topics</h2>
          <Link to="/knowledge/search" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>
            Browse All Articles ({articles.length}) →
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: 18
        }}>
          {featuredArticles.map(art => (
            <div 
              key={art.id} 
              className="card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                padding: 22,
                minHeight: '220px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span className={`badge ${getDifficultyBadgeClass(art.difficulty)}`} style={{ fontSize: '10px' }}>
                    {art.difficulty}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {art.category}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', margin: '6px 0' }}>{art.title}</h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '13px', lineHeight: '1.5', marginBottom: 16 }}>
                  {art.summary}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-sub)', paddingTop: 12, marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {art.mitreId !== '—' && (
                    <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', background: 'rgba(0, 242, 254, 0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                      MITRE {art.mitreId}
                    </span>
                  )}
                </div>
                <Link 
                  to={`/knowledge/topic/${art.slug}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    color: 'var(--accent)', 
                    fontWeight: 700, 
                    fontSize: '12px' 
                  }}
                  className="read-article-link"
                >
                  Read Article <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🏷️ Popular Topics Quicklinks */}
      <div className="card" style={{ padding: 24 }}>
        <h2 className="section-title" style={{ fontSize: '13px', marginBottom: 12 }}>🔥 Popular Catalog Topics</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {popularArticles.map(art => (
            <Link
              key={art.slug}
              to={`/knowledge/topic/${art.slug}`}
              className="toggle-btn"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}
            >
              <BookOpen size={12} color="var(--accent)" />
              <span>{art.title}</span>
              {art.mitreId !== '—' && (
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>({art.mitreId})</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
