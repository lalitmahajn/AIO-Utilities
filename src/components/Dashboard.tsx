import React, { useState, Suspense } from 'react';
import { registry, type Utility } from '../core/registry';
import '../styles/global.css';

const CATEGORY_META: Record<string, { color: string; label: string }> = {
  calculators: { color: '#f59e0b', label: 'Calculator' },
  converters: { color: '#10b981', label: 'Converter' },
  formatters: { color: '#8b5cf6', label: 'Formatter' },
  productivity: { color: '#3b82f6', label: 'Productivity' },
  documents: { color: '#ef4444', label: 'Documents' },
  generators: { color: '#ec4899', label: 'Generator' },
  image: { color: '#38bdf8', label: 'Image' },
  other: { color: '#6b7280', label: 'Other' },
};

const Dashboard: React.FC = () => {
  const [selectedUtility, setSelectedUtility] = useState<Utility | null>(null);
  const [search, setSearch] = useState('');

  const utilities = registry.getAllUtilities();

  // Sync state with hash on mount and when hash changes
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const found = utilities.find(u => u.id === hash);
        setSelectedUtility(found || null);
      } else {
        setSelectedUtility(null);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [utilities]);

  // Helper to change utility via hash
  const navigateTo = (id: string | null) => {
    window.location.hash = id || '';
  };
  const filteredUtilities = utilities.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Top Navigation Bar */}
      <nav 
        className="dashboard-nav"
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          background: 'rgba(15, 23, 42, 0.65)', 
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.75rem 2rem',
          transition: 'padding 0.3s ease'
        }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
            onClick={() => navigateTo(null)}
          >
            <img 
              src={`${import.meta.env.BASE_URL}logo.png`} 
              alt="Logo" 
              style={{ width: '32px', height: '32px', borderRadius: '0.5rem' }} 
            />
            <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '-0.02em' }}>
              AIO Utilities
            </span>
          </div>
          
          {selectedUtility && (
            <button 
              onClick={() => navigateTo(null)}
              className="dashboard-button"
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.85rem', 
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </nav>

      <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {!selectedUtility && (
          <header style={{ marginBottom: '3rem', textAlign: 'center', paddingTop: '2rem' }}>
            {/* Hero with subtle gradient orb */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '400px',
                height: '200px',
                background: 'radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <h1 className="gradient-text hero-title" style={{ position: 'relative' }}>
                Essential Tools, Simplified.
              </h1>
            </div>
            <p className="hero-subtitle">
              A premium collection of utilities for your daily digital needs.
            </p>
            
            {/* Search bar with icon */}
            <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.1rem',
                opacity: 0.4,
                pointerEvents: 'none',
              }}>🔍</span>
              <input
                type="text"
                placeholder="Search utilities (e.g. 'Age', 'QR', 'PDF')..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem 1.5rem 1.25rem 3.25rem', 
                  fontSize: '1.1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '1rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
              />
            </div>

            {/* Utility count */}
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
              {utilities.length} tools available
            </p>
          </header>
        )}

      {selectedUtility ? (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <Suspense fallback={
            <div className="glass-card fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div className="loading-spinner" style={{ 
                margin: '0 auto 1.5rem',
                width: '40px',
                height: '40px',
                border: '3px solid rgba(56, 189, 248, 0.1)',
                borderTopColor: 'var(--accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                Optimizing your tool...
              </p>
            </div>
          }>
            <selectedUtility.component />
          </Suspense>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredUtilities.map(u => {
            const catMeta = CATEGORY_META[u.category] || CATEGORY_META.other;
            return (
              <div 
                key={u.id} 
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => navigateTo(u.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = catMeta.color;
                  e.currentTarget.style.boxShadow = `0 8px 30px -8px ${catMeta.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${catMeta.color}, transparent)`,
                  opacity: 0.6,
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Icon */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '0.75rem',
                    background: `${catMeta.color}15`,
                    border: `1px solid ${catMeta.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                  }}>
                    {u.icon || '⚡'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      marginBottom: '0.35rem', 
                      color: 'var(--text-primary)', 
                      fontSize: '1rem', 
                      fontWeight: '600',
                      letterSpacing: '-0.01em',
                    }}>
                      {u.name}
                    </h3>
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.85rem', 
                      lineHeight: '1.4',
                      margin: 0,
                    }}>
                      {u.description}
                    </p>
                  </div>
                </div>

                {/* Category badge */}
                <div style={{ marginTop: '1rem' }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: '600',
                    color: catMeta.color,
                    background: `${catMeta.color}12`,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    border: `1px solid ${catMeta.color}25`,
                  }}>
                    {catMeta.label}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredUtilities.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>🔍</div>
              <p>No utilities found matching "{search}"</p>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <footer style={{
        marginTop: '4rem',
        padding: '2rem 1rem',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <p>
          &copy; {new Date().getFullYear()} All-in-One Utilities. Developed by 
          <a href="https://github.com/lalitmahajn" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', marginLeft: '0.25rem', fontWeight: '500' }}>
            Lalit
          </a>.
        </p>
      </footer>
      </div>
    </div>
  );
};

export default Dashboard;
