import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BookOpen, HelpCircle, ArrowRight, ShieldAlert, Bug, AlertTriangle, ShieldCheck, Network, Cpu } from 'lucide-react'
import { categoriesList, articles } from '../../data/mockKnowledge'

const CATEGORY_ICONS = {
  "attacks-threats": <ShieldAlert size={36} style={{ color: 'var(--critical)' }} />,
  "malware": <Bug size={36} style={{ color: 'var(--high)' }} />,
  "vulnerabilities": <AlertTriangle size={36} style={{ color: 'var(--medium)' }} />,
  "defense-security": <ShieldCheck size={36} style={{ color: 'var(--low)' }} />,
  "networking": <Network size={36} style={{ color: 'var(--accent)' }} />,
  "mitre-attack": <Cpu size={36} style={{ color: '#a855f7' }} />
}

export default function KnowledgeCategory() {
  const { category } = useParams()
  const [sortOrder, setSortOrder] = useState('alphabetical')
  const [filteredArticles, setFilteredArticles] = useState([])

  // Find the category based on URL slug parameter
  const categoryDetails = categoriesList.find(c => c.id === category)

  useEffect(() => {
    if (!categoryDetails) return

    let list = articles.filter(a => a.category.toLowerCase() === categoryDetails.name.toLowerCase())

    // Apply sorting
    if (sortOrder === 'alphabetical') {
      list.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortOrder === 'difficulty') {
      const diffWeight = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
      list.sort((a, b) => diffWeight[a.difficulty.toLowerCase()] - diffWeight[b.difficulty.toLowerCase()])
    }

    setFilteredArticles(list)
  }, [categoryDetails, sortOrder])

  if (!categoryDetails) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 20px', textAlign: 'center' }}>
        <HelpCircle size={48} color="var(--critical)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800 }}>Category Not Found</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '14px', marginTop: 8 }}>
          The cybersecurity category you are trying to view does not exist in our system.
        </p>
        <Link to="/knowledge" className="btn btn-primary" style={{ marginTop: 20 }}>
          Back to Knowledge Base Home
        </Link>
      </div>
    )
  }

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
      
      {/* 🗺️ Breadcrumbs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-sub)', marginBottom: 20 }}>
        <Link to="/knowledge" style={{ hoverColor: 'var(--accent)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
          Knowledge Base
        </Link>
        <span>/</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>{categoryDetails.name}</span>
      </nav>

      {/* 📁 Category Header Banner */}
      <div 
        className="card" 
        style={{ 
          marginBottom: 28, 
          padding: '24px 28px', 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.00) 100%)', 
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{
          padding: 16,
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-sub)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {CATEGORY_ICONS[categoryDetails.id] || <BookOpen size={36} color="var(--accent)" />}
        </div>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            Category: {categoryDetails.name}
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            {categoryDetails.description}
          </p>
        </div>
      </div>

      {/* 🎛️ Sort Controls & Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
          Showing <strong style={{ color: '#fff' }}>{filteredArticles.length}</strong> articles
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
          <select 
            className="filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              background: 'rgba(5, 8, 15, 0.95)',
              border: '1px solid var(--border)',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="alphabetical">Alphabetical A-Z</option>
            <option value="difficulty">Difficulty Level</option>
          </select>
        </div>
      </div>

      {/* 🗂️ Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: 18
        }}>
          {filteredArticles.map(art => (
            <div 
              key={art.id} 
              className="card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                padding: 22,
                minHeight: '200px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className={`badge ${getDifficultyBadgeClass(art.difficulty)}`} style={{ fontSize: '10px' }}>
                    {art.difficulty}
                  </span>
                  {art.mitreId !== '—' && (
                    <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      MITRE {art.mitreId}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
                  <Link to={`/knowledge/topic/${art.slug}`} style={{ hoverColor: 'var(--accent)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = '#fff'}>
                    {art.title}
                  </Link>
                </h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '13px', lineHeight: '1.5', marginBottom: 16 }}>
                  {art.summary}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-sub)', paddingTop: 12, marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {art.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
                <Link 
                  to={`/knowledge/topic/${art.slug}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    color: 'var(--accent)', 
                    fontWeight: 700, 
                    fontSize: '12px',
                    textDecoration: 'none' 
                  }}
                >
                  Read Topic <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center', border: '1px dashed var(--border)' }}>
          <p style={{ color: 'var(--text-sub)', fontSize: '13px' }}>
            No articles found in this category yet.
          </p>
        </div>
      )}

    </div>
  )
}
