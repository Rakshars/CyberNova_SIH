import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { getKnowledgeCategories, getKnowledgeArticles } from '../../api'

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

  // Read search filters and parameters directly from URL parameters
  const queryParam = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category') || 'All'
  const difficultyParam = searchParams.get('difficulty') || 'All'
  const sortByParam = searchParams.get('sort_by') || 'relevance'
  const pageParam = parseInt(searchParams.get('page') || '1', 10)
  const tagParam = searchParams.get('tag') || ''

  // Input states
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [categories, setCategories] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Suggestions & Autocomplete state
  const [allArticles, setAllArticles] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [totalResults, setTotalResults] = useState(0)

  // Update URL parameters helper
  const updateParams = (newParams) => {
    const updated = {
      q: queryParam,
      category: categoryParam,
      difficulty: difficultyParam,
      sort_by: sortByParam,
      page: pageParam.toString(),
      tag: tagParam,
      ...newParams
    }
    
    // Clean up default/empty values to keep URL readable
    Object.keys(updated).forEach(key => {
      if (
        updated[key] === '' || 
        updated[key] === 'All' || 
        (key === 'page' && updated[key] === '1') || 
        (key === 'sort_by' && updated[key] === 'relevance')
      ) {
        delete updated[key]
      }
    })
    
    setSearchParams(updated)
  }

  // Synchronize input box with URL parameter query on load/update
  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  // Debounce typing to automatically trigger search after 500ms pause
  useEffect(() => {
    if (searchQuery.trim() === queryParam.trim()) return

    const delayDebounceFn = setTimeout(() => {
      updateParams({ q: searchQuery.trim(), page: '1' })
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getKnowledgeCategories()
        setCategories(cats)
      } catch (err) {
        console.error("Error loading categories:", err)
      }
    }
    loadCategories()
  }, [])

  // Fetch all articles once on mount to feed autocomplete suggestions
  useEffect(() => {
    async function loadAllArticles() {
      try {
        const data = await getKnowledgeArticles({ limit: 150 })
        setAllArticles(data.items || [])
      } catch (err) {
        console.error("Error loading all articles for autocomplete:", err)
      }
    }
    loadAllArticles()
  }, [])

  // Fetch search results on search parameters update
  const loadResults = async () => {
    try {
      setLoading(true)
      const data = await getKnowledgeArticles({
        q: queryParam,
        category: categoryParam,
        difficulty: difficultyParam,
        tag: tagParam,
        page: pageParam,
        limit: 5, // Return 5 results per page for testing pagination
        sort_by: sortByParam
      })
      setResults(data.items || [])
      setTotalResults(data.total || 0)
      setError(null)
    } catch (err) {
      console.error("Error loading search results:", err)
      setError("Failed to fetch topics from database server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [queryParam, categoryParam, difficultyParam, tagParam, pageParam, sortByParam])

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSuggestions(false)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  // Input typing search suggestions
  const handleInputChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    
    if (val.trim().length >= 2) {
      const queryLower = val.toLowerCase().trim()
      const matches = []
      const matchedTexts = new Set()
      
      for (const art of allArticles) {
        // Match titles
        if (art.title.toLowerCase().includes(queryLower)) {
          if (!matchedTexts.has(art.title)) {
            matches.push({ type: 'title', text: art.title, slug: art.slug })
            matchedTexts.add(art.title)
          }
        }
        // Match tags
        for (const t of art.tags) {
          if (t.toLowerCase().includes(queryLower)) {
            const tagText = `#${t}`
            if (!matchedTexts.has(tagText)) {
              matches.push({ type: 'tag', text: tagText, tag: t })
              matchedTexts.add(tagText)
            }
          }
        }
      }
      setSuggestions(matches.slice(0, 5))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (sug) => {
    if (sug.type === 'title') {
      setSearchQuery(sug.text)
      updateParams({ q: sug.text, page: '1' })
    } else if (sug.type === 'tag') {
      setSearchQuery(sug.text)
      updateParams({ tag: sug.tag, page: '1' })
    }
    setShowSuggestions(false)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ q: searchQuery.trim(), page: '1' })
    setShowSuggestions(false)
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

  // Derive unique tags from all loaded articles for optional filter list
  const allTags = [...new Set(allArticles.flatMap(art => art.tags))]
  const totalPages = Math.ceil(totalResults / 5)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 🔍 Search Input Bar Card */}
      <div className="card" style={{ marginBottom: 24, padding: isMobile ? '14px 16px' : '20px 24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12 }}>
          <div 
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Search 
              size={18} 
              color="var(--text-sub)" 
              style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} 
            />
            <input
              type="text"
              className="filter-input"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowSuggestions(true)
              }}
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

            {/* Live Autocomplete Suggestions Box */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="card autocomplete-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  zIndex: 1001,
                  background: 'rgba(9, 13, 24, 0.98)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  padding: '6px 0',
                  overflow: 'hidden'
                }}
              >
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(sug)}
                    className="autocomplete-item"
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: sug.type === 'tag' ? 'var(--accent)' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{sug.text}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {sug.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sub)', margin: 0 }}>Filters</h3>
          </div>

          {/* Category Filters */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Category</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', cursor: 'pointer', color: categoryParam === 'All' ? 'var(--text)' : 'var(--text-sub)' }}>
                <input 
                  type="radio" 
                  name="category" 
                  checked={categoryParam === 'All'} 
                  onChange={() => updateParams({ category: 'All', page: '1' })} 
                  style={{ accentColor: 'var(--accent)' }}
                />
                All Categories
              </label>
              {categories.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', cursor: 'pointer', color: categoryParam === cat.name ? 'var(--text)' : 'var(--text-sub)' }}>
                  <input 
                    type="radio" 
                    name="category" 
                    checked={categoryParam === cat.name} 
                    onChange={() => updateParams({ category: cat.name, page: '1' })} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Filters */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Difficulty</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
                <label key={diff} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', cursor: 'pointer', color: difficultyParam === diff ? 'var(--text)' : 'var(--text-sub)' }}>
                  <input 
                    type="radio" 
                    name="difficulty" 
                    checked={difficultyParam === diff} 
                    onChange={() => updateParams({ difficulty: diff, page: '1' })} 
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {diff}
                </label>
              ))}
            </div>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Tags</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => updateParams({ tag: '', page: '1' })}
                  className={`toggle-btn ${!tagParam ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '4px 8px' }}
                >
                  All Tags
                </button>
                {allTags.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateParams({ tag: t, page: '1' })}
                    className={`toggle-btn ${tagParam === t ? 'active' : ''}`}
                    style={{ fontSize: '10px', padding: '4px 8px' }}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* 📑 Right Results List Panel */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Results Summary Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
              Found <strong style={{ color: 'var(--text)' }}>{totalResults}</strong> matching topics
              {queryParam && <span> for "<span style={{ color: 'var(--accent)' }}>{queryParam}</span>"</span>}
              {tagParam && <span> with tag "<span style={{ color: 'var(--accent)' }}>#{tagParam}</span>"</span>}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Sort selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
                <select
                  value={sortByParam}
                  onChange={(e) => updateParams({ sort_by: e.target.value, page: '1' })}
                  style={{
                    background: 'rgba(5, 8, 15, 0.95)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="az">A-Z</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>

              {(categoryParam !== 'All' || difficultyParam !== 'All' || tagParam !== '' || queryParam !== '') && (
                <button 
                  onClick={() => { setSearchQuery(''); setSearchParams({}); }}
                  style={{ fontSize: '11px', color: 'var(--critical)', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 700 }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results Loop */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}>
              <RefreshCw className="animate-spin" size={24} color="var(--accent)" />
              <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>Searching cybersecurity topics...</span>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '30px 20px', textAlign: 'center', border: '1px dashed var(--critical)' }}>
              <AlertCircle size={28} color="var(--critical)" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: 'var(--text-sub)', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map(art => (
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
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                        <Link to={`/knowledge/topic/${art.slug}`} style={{ hoverColor: 'var(--accent)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>
                          {art.title}
                        </Link>
                      </h3>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{art.category}</span>
                      <span className={`badge ${getDifficultyBadgeClass(art.difficulty)}`} style={{ fontSize: '10px' }}>{art.difficulty}</span>
                    </div>

                    {/* Relevance Indicator */}
                    {queryParam && art.relevanceScore !== null && (
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
                      {art.mitreId && art.mitreId !== '—' && (
                        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent)', background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                          MITRE {art.mitreId}
                        </span>
                      )}
                      {art.tags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => updateParams({ tag: tag, page: '1' })}
                          style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.03)', padding: '2px 6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          #{tag}
                        </button>
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

              {/* Numbered/Next-Prev Pagination UI Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24, paddingBottom: 24 }}>
                  <button
                    type="button"
                    disabled={pageParam <= 1}
                    onClick={() => updateParams({ page: (pageParam - 1).toString() })}
                    className="btn btn-ghost"
                    style={{ padding: '6px 16px', fontSize: '12px' }}
                  >
                    ← Previous
                  </button>
                  <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                    Page <strong style={{ color: 'var(--text)' }}>{pageParam}</strong> of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageParam >= totalPages}
                    onClick={() => updateParams({ page: (pageParam + 1).toString() })}
                    className="btn btn-ghost"
                    style={{ padding: '6px 16px', fontSize: '12px' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            // No Results / Empty State
            <div 
              className="card" 
              style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}
            >
              <AlertCircle size={36} color="var(--critical)" />
              <div>
                <h4 style={{ color: 'var(--text)', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>
                  No cybersecurity topics found
                </h4>
                {queryParam && (
                  <p style={{ color: 'var(--text-sub)', fontSize: '13.5px', marginBottom: 12 }}>
                    We couldn't find matches for "<span style={{ color: 'var(--accent)' }}>{queryParam}</span>"
                  </p>
                )}
                <p style={{ color: 'var(--text-sub)', fontSize: '13px', maxWidth: '500px', margin: '0 auto 16px' }}>
                  Try adjusting your search filters or browse one of our common cybersecurity terms:
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, maxWidth: '500px', margin: '0 auto' }}>
                  {['Ransomware', 'Phishing', 'Malware', 'SIEM', 'MITRE ATT&CK', 'Zero Trust'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSearchQuery(term);
                        updateParams({ q: term, category: 'All', difficulty: 'All', tag: '', page: '1' });
                      }}
                      className="toggle-btn"
                      style={{ fontSize: '11px' }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setSearchQuery(''); setSearchParams({}); }}
                className="btn btn-ghost" 
                style={{ fontSize: '12px', marginTop: 8 }}
              >
                Reset all filters & search
              </button>
            </div>
          )}

        </section>
      </div>
    </div>
  )
}
