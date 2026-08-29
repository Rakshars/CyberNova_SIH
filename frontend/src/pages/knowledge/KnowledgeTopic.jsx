import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BookOpen, Calendar, HelpCircle, ShieldAlert, Cpu, Layers, ExternalLink, ArrowRight, ArrowDown } from 'lucide-react'
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

export default function KnowledgeTopic() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const width = useWindowWidth()
  const isMobile = width < 768

  // Find the article based on slug
  const article = articles.find(a => a.slug === slug)

  if (!article) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 20px', textAlign: 'center' }}>
        <HelpCircle size={48} color="var(--critical)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 800 }}>Article Not Found</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '14px', marginTop: 8 }}>
          The cybersecurity topic you are trying to view does not exist in our Knowledge Base or has been moved.
        </p>
        <Link to="/knowledge" className="btn btn-primary" style={{ marginTop: 20 }}>
          Back to Knowledge Base Home
        </Link>
      </div>
    )
  }

  // Find corresponding category ID for breadcrumb routing
  const categoryObject = categoriesList.find(c => c.name.toLowerCase() === article.category.toLowerCase())
  const categoryId = categoryObject ? categoryObject.id : 'attacks-threats'

  // Map slugs to full article objects for Related Topics
  const relatedArticles = article.relatedTopics
    .map(rSlug => articles.find(a => a.slug === rSlug))
    .filter(Boolean)

  const getDifficultyBadgeClass = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'badge-low'
      case 'intermediate': return 'badge-medium'
      case 'advanced': return 'badge-critical'
      default: return 'badge-neutral'
    }
  }

  // Smooth scroll handler for Table of Contents
  const handleScrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 🗺️ Breadcrumbs Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-sub)', marginBottom: 20, flexWrap: 'wrap' }}>
        <Link to="/knowledge" style={{ hoverColor: 'var(--accent)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
          Knowledge Base
        </Link>
        <span>/</span>
        <Link to={`/knowledge/category/${categoryId}`} style={{ hoverColor: 'var(--accent)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}>
          {article.category}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 600, wordBreak: 'break-word' }}>{article.title}</span>
      </nav>

      {/* 📰 Main Article Header */}
      <div 
        className="card" 
        style={{ 
          marginBottom: 24, 
          padding: isMobile ? '16px 20px' : '24px 28px', 
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.04) 0%, rgba(255, 42, 109, 0.02) 100%)',
          borderLeft: '4px solid var(--accent)'
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <span className={`badge ${getDifficultyBadgeClass(article.difficulty)}`}>{article.difficulty}</span>
          <span className="badge badge-neutral">{article.category}</span>
          {article.mitreId !== '—' && (
            <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
              MITRE ATT&CK {article.mitreId}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em', lineBreak: 'anywhere', wordBreak: 'break-word' }}>
          {article.title}
        </h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          {article.summary}
        </p>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '220px 1fr 280px', 
          gap: 24, 
          alignItems: 'flex-start' 
        }} 
        className="article-page-layout"
      >
        
        {/* 📋 Left Side: Table of Contents (Sticky on Desktop) */}
        {!isMobile && (
          <nav 
            style={{ 
              position: 'sticky', 
              top: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12, 
              padding: '14px 4px' 
            }}
            className="toc-sidebar"
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Table of Contents
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '1px solid var(--border-sub)' }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'how-it-works', label: 'How It Works' },
                ...(article.content.attackFlow ? [{ id: 'attack-flow', label: 'Attack Flow' }] : []),
                { id: 'detection', label: 'Detection' },
                { id: 'prevention', label: 'Prevention' },
                ...(relatedArticles.length > 0 ? [{ id: 'related-topics', label: 'Related Topics' }] : []),
                { id: 'references', label: 'References' }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => handleScrollToSection(sec.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    padding: '6px 14px',
                    fontSize: '13px',
                    color: 'var(--text-sub)',
                    cursor: 'pointer',
                    borderLeft: '2px solid transparent',
                    marginLeft: '-1px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--text)'
                    e.currentTarget.style.borderLeftColor = 'rgba(0, 242, 254, 0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-sub)'
                    e.currentTarget.style.borderLeftColor = 'transparent'
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* 📝 Center: Main Content */}
        <article style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', minWidth: 0 }} className="article-body">
          {/* Mobile TOC Row */}
          {isMobile && (
            <div 
              style={{ 
                display: 'flex', 
                gap: 8, 
                overflowX: 'auto', 
                padding: '8px 4px 12px', 
                whiteSpace: 'nowrap', 
                borderBottom: '1px solid var(--border-sub)', 
                marginBottom: 4,
                scrollbarWidth: 'none'
              }}
              className="mobile-toc-row"
            >
              <style>{`
                .mobile-toc-row::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'how-it-works', label: 'How It Works' },
                ...(article.content.attackFlow ? [{ id: 'attack-flow', label: 'Attack Flow' }] : []),
                { id: 'detection', label: 'Detection' },
                { id: 'prevention', label: 'Prevention' },
                ...(relatedArticles.length > 0 ? [{ id: 'related-topics', label: 'Related Topics' }] : []),
                { id: 'references', label: 'References' }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => handleScrollToSection(sec.id)}
                  className="toggle-btn"
                  style={{ fontSize: '12px', padding: '6px 12px', flexShrink: 0 }}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          )}
          
          {/* Overview Section */}
          <section id="overview" className="card" style={{ padding: isMobile ? '16px 20px' : '24px 28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border-sub)', paddingBottom: 10, marginBottom: 14 }}>
              Overview
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text)', lineHeight: '1.65', margin: 0 }}>
              {article.content.overview}
            </p>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="card" style={{ padding: isMobile ? '16px 20px' : '24px 28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border-sub)', paddingBottom: 10, marginBottom: 14 }}>
              How It Works
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text)', lineHeight: '1.65', margin: 0 }}>
              {article.content.howItWorks}
            </p>
          </section>

          {/* Attack Flow Visualization Section */}
          {article.content.attackFlow && (
            <section id="attack-flow" className="card" style={{ padding: isMobile ? '16px 20px' : '24px 28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border-sub)', paddingBottom: 10, marginBottom: 16 }}>
                Attack Flow Sequence
              </h2>
              
              {/* Connected node sequence */}
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12, 
                  background: 'var(--surface-2)', 
                  padding: 20, 
                  borderRadius: '10px',
                  border: '1px solid var(--border-sub)' 
                }}
              >
                {article.content.attackFlow.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    
                    {/* Node Card */}
                    <div 
                      style={{ 
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0, 242, 254, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent)'
                        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 242, 254, 0.15)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.2)'
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 242, 254, 0.05)'
                      }}
                    >
                      {/* Step Indicator */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(0, 242, 254, 0.12)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        border: '1px solid rgba(0, 242, 254, 0.4)'
                      }}>
                        {idx + 1}
                      </div>

                      {/* Step Text */}
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                        {step}
                      </span>
                    </div>

                    {/* Connecting Arrow (show for all but the last step) */}
                    {idx < article.content.attackFlow.length - 1 && (
                      <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <ArrowDown size={14} color="var(--accent)" style={{ opacity: 0.6 }} />
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </section>
          )}

          {/* Detection Section */}
          <section id="detection" className="card" style={{ padding: isMobile ? '16px 20px' : '24px 28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border-sub)', paddingBottom: 10, marginBottom: 14 }}>
              Detection
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text)', lineHeight: '1.65', margin: 0 }}>
              {article.content.detection}
            </p>
          </section>

          {/* Prevention Section */}
          <section id="prevention" className="card" style={{ padding: isMobile ? '16px 20px' : '24px 28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border-sub)', paddingBottom: 10, marginBottom: 14 }}>
              Prevention &amp; Mitigation
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text)', lineHeight: '1.65', margin: 0 }}>
              {article.content.prevention}
            </p>
          </section>

          {/* Related Topics Section */}
          {relatedArticles.length > 0 && (
            <section id="related-topics" className="card" style={{ padding: isMobile ? '16px 20px' : '24px 28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border-sub)', paddingBottom: 10, marginBottom: 14 }}>
                Related Topics
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
                {relatedArticles.map(rel => (
                  <Link 
                    key={rel.slug} 
                    to={`/knowledge/topic/${rel.slug}`}
                    className="card"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: 16,
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      height: '100%',
                      margin: 0,
                      animation: 'none'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-sub)'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>{rel.title}</h4>
                      <p style={{ color: 'var(--text-sub)', fontSize: '11px', margin: 0, lineHeight: '1.4' }}>
                        {rel.summary.substring(0, 80)}...
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* References Section */}
          <section id="references" className="card" style={{ padding: isMobile ? '16px 20px' : '24px 28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border-sub)', paddingBottom: 10, marginBottom: 14 }}>
              References
            </h2>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '13.5px', color: 'var(--text-sub)' }}>
              {article.references.map((ref, idx) => (
                <li key={idx} style={{ lineHeight: '1.5' }}>
                  {ref.includes('http') || ref.includes('MITRE') || ref.includes('CISA') || ref.includes('NIST') ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text)' }}>
                      {ref} <ExternalLink size={12} color="var(--accent)" />
                    </span>
                  ) : ref}
                </li>
              ))}
            </ul>
          </section>

        </article>

        {/* 📊 Right Side: Info Panel & Attack Simulation Link */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="info-sidebar">
          
          {/* Metadata Card */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
              Topic Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '13px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-sub)' }}>Category:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{article.category}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-sub)' }}>Difficulty:</span>
                <span className={`badge ${getDifficultyBadgeClass(article.difficulty)}`} style={{ fontSize: '10px' }}>
                  {article.difficulty}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-sub)' }}>MITRE ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: article.mitreId === '—' ? 'var(--text-muted)' : 'var(--accent)' }}>
                  {article.mitreId}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-sub)' }}>Last Updated:</span>
                <span style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} color="var(--text-muted)" />
                  {article.lastUpdated}
                </span>
              </div>

            </div>
          </div>

          {/* 💥 Future Simulator Link Card */}
          <div 
            className="card" 
            style={{ 
              padding: 20, 
              background: 'linear-gradient(135deg, rgba(255, 42, 109, 0.08) 0%, rgba(255, 42, 109, 0.01) 100%)',
              border: '1px solid rgba(255, 42, 109, 0.3)' 
            }}
          >
            <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--critical)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} /> Adversary Simulator
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-sub)', lineHeight: '1.4', marginBottom: 16 }}>
              Emulate the behavioral tactics of this threat pattern inside our safe sandbox container to trigger alerts and test SOAR responses.
            </p>

            {/* In Phase 1 this is just a mockup with clean state styling */}
            <button
              className="btn"
              disabled
              title="Simulator connection will be activated in Phase 2"
              style={{
                width: '100%',
                background: 'rgba(255, 42, 109, 0.1)',
                border: '1px solid rgba(255, 42, 109, 0.3)',
                color: 'var(--critical)',
                cursor: 'not-allowed',
                fontSize: '12px',
                padding: '10px',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              ⚡ Simulate {article.title}
            </button>
            <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
              Simulation integration active in Phase 2
            </span>
          </div>

        </aside>

      </div>

    </div>
  )
}
