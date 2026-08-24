import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, AlertCircle, ArrowRight } from 'lucide-react'
import { articles, categoriesList } from '../../data/mockKnowledge'

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return width
}

export default function KnowledgeSearch() {
  const width = useWindowWidth()
  const isMobile = width < 768
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [results, setResults] = useState([])

  // Synchronize input box with URL parameter query on load/update
  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  // Filter logic runs against mock data
  useEffect(() => {
    let filtered = articles.map(art => {
      // Calculate a basic relevance score based on match location
      let score = 0
      const q = queryParam.toLowerCase().trim()
      
      if (!q) {
        score = 80 // Default base score if no text query
      } else {
        if (art.title.toLowerCase() === q) score += 100
        else if (art.title.toLowerCase().includes(q)) score += 85
        
        art.tags.forEach(t => {
          if (t.toLowerCase().includes(q)) score += 15
        })

        if (art.mitreId.toLowerCase().includes(q)) score += 40
        if (art.summary.toLowerCase().includes(q)) score += 20
        if (art.category.toLowerCase().includes(q)) score += 10
        if (art.content.overview.toLowerCase().includes(q)) score += 5
      }

      return { ...art, relevanceScore: Math.min(score, 100) }
    })

    // Filter by text search query if query exists
    if (queryParam.trim() !== '') {
      const q = queryParam.toLowerCase().trim()
      filtered = filtered.filter(art => 
        art.relevanceScore > 0 ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.mitreId.toLowerCase().includes(q) ||
        art.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    // Filter by Category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(art => art.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Filter by Difficulty
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(art => art.difficulty.toLowerCase() === selectedDifficulty.toLowerCase())
    }

    // Sort by relevance score desc
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore)

    setResults(filtered)
  }, [queryParam, selectedCategory, selectedDifficulty])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchParams({ q: searchQuery.trim() })
  }

  const getDifficultyBadgeClass = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'badge-low'
      case 'intermediate': return 'badge-medium'
      case 'advanced': return 'badge-critical'
      default: return 'badge-neutral'
    }
  }

  const getRelevanceColor = (score) => {
    if (score >= 80) return 'var(--low)'
    if (score >= 50) return 'var(--high)'
    return 'var(--text-muted)'
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 🔍 Search Input Bar Card */}
      <div className="card" style={{ marginBottom: 24, padding: isMobile ? '14px 16px' : '20px 24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search 
              size={18} 
              color="var(--text-sub)" 
              style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} 
            />
            <input
              type="text"
              className="filter-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cybersecurity topics..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                fontSize: '14px',
                borderRadius: '8px',
                background: 'rgba(5, 8, 15, 0.95)',
                border: '1px solid var(--border)',
                color: '#fff',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: isMobile ? '0 16px' : '0 24px', fontSize: '13px' }}>
            Search
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', gap: 24, alignItems: 'flex-start' }} className="search-grid-layout">
        
        {/* 🎛️ Left Filters Panel */}
        <aside className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-sub)', paddingBottom: 8 }}>
            <Filter size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sub)', margin: 0 }}>Search Filters</h3>
          </div>

          {/* Category Filters */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Category</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', cursor: 'pointer', color: selectedCategory === 'All' ? '#fff' : 'var(--text-sub)' }}>
                <input 
                  type="radio" 
                  name="category" 
                  checked={selectedCategory === 'All'} 
                  onChange={() => setSelectedCategory('All')} 
                  style={{ accentColor: 'var(--accent)' }}
                />
                All Categories
              </label>
              {categoriesList.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', cursor: 'pointer', color: selectedCategory === cat.name ? '#fff' : 'var(--text-sub)' }}>
                  <input 
                    type="radio" 
                    name="category" 
                    checked={selectedCategory === cat.name} 
                    onChange={() => setSelectedCategory(cat.name)} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Filters */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Difficulty</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
                <label key={diff} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', cursor: 'pointer', color: selectedDifficulty === diff ? '#fff' : 'var(--text-sub)' }}>
                  <input 
                    type="radio" 
                    name="difficulty" 
                    checked={selectedDifficulty === diff} 
                    onChange={() => setSelectedDifficulty(diff)} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {diff}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* 📑 Right Results List Panel */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Results Summary Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
              Found <strong style={{ color: '#fff' }}>{results.length}</strong> matching topics
              {queryParam && <span> for "<span style={{ color: 'var(--accent)' }}>{queryParam}</span>"</span>}
            </span>
            {(selectedCategory !== 'All' || selectedDifficulty !== 'All') && (
              <button 
                onClick={() => { setSelectedCategory('All'); setSelectedDifficulty('All'); }}
                style={{ fontSize: '11px', color: 'var(--critical)', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 700 }}
              >
                Clear Active Filters
              </button>
            )}
          </div>

          {/* Results Loop */}
          {results.length > 0 ? (
            results.map(art => (
              <div 
                key={art.id} 
                className="card" 
                style={{ 
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'transform var(--transition), border-color var(--transition)' 
                }}
              >
                {/* Result Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                      <Link to={`/knowledge/topic/${art.slug}`} style={{ hoverColor: 'var(--accent)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = '#fff'}>
                        {art.title}
                      </Link>
                    </h3>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{art.category}</span>
                    <span className={`badge ${getDifficultyBadgeClass(art.difficulty)}`} style={{ fontSize: '10px' }}>{art.difficulty}</span>
                  </div>

                  {/* Relevance Indicator */}
                  {queryParam && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Match relevance:</span>
                      <span 
                        style={{ 
                          fontSize: '12px', 
                          fontFamily: "'JetBrains Mono', monospace", 
                          fontWeight: 700, 
                          color: getRelevanceColor(art.relevanceScore) 
                        }}
                      >
                        {art.relevanceScore}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Result Description */}
                <p style={{ color: 'var(--text-sub)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  {art.summary}
                </p>

                {/* Result Bottom Tags and Links */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-sub)', paddingTop: 12, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {art.mitreId !== '—' && (
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent)', background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        MITRE {art.mitreId}
                      </span>
                    )}
                    {art.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.03)', padding: '2px 6px', borderRadius: '4px' }}>
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
            ))
          ) : (
            // No Results State
            <div 
              className="card" 
              style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              <AlertCircle size={32} color="var(--critical)" />
              <div>
                <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>No Knowledge Topics Found</h4>
                <p style={{ color: 'var(--text-sub)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
                  We couldn't find any articles matching your search query or filters. Try adjusting your keywords or clearing the category selection.
                </p>
              </div>
              <button 
                onClick={() => { setSearchQuery(''); setSearchParams({}); setSelectedCategory('All'); setSelectedDifficulty('All'); }}
                className="btn btn-ghost" 
                style={{ fontSize: '12px', marginTop: 8 }}
              >
                Reset Search parameters
              </button>
            </div>
          )}

        </section>

      </div>

    </div>
  )
}
