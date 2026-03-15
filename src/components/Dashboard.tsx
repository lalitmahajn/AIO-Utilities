import React, { useState } from 'react';
import { registry, type Utility } from '../core/registry';
import '../styles/global.css';

const Dashboard: React.FC = () => {
  const [selectedUtility, setSelectedUtility] = useState<Utility | null>(null);
  const [search, setSearch] = useState('');
  
  const utilities = registry.getAllUtilities();
  const filteredUtilities = utilities.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <nav 
        className="dashboard-nav"
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          background: 'rgba(15, 23, 42, 0.8)', 
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.75rem 2rem',
          transition: 'padding 0.3s ease'
        }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
            onClick={() => setSelectedUtility(null)}
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
              onClick={() => setSelectedUtility(null)}
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
          <header style={{ marginBottom: '3rem', textAlign: 'center', paddingTop: '1.5rem' }}>
            <h1 className="gradient-text hero-title">
              Essential Tools, Simplified.
            </h1>
            <p className="hero-subtitle">
              A premium collection of utilities for your daily digital needs.
            </p>
            
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Search utilities (e.g. 'Age', 'Unit')..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem 1.5rem', 
                  fontSize: '1.1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '1rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>
          </header>
        )}

      {selectedUtility ? (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <selectedUtility.component />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filteredUtilities.map(u => (
            <div 
              key={u.id} 
              className="glass-card" 
              style={{ cursor: 'pointer', transition: 'var(--transition)' }}
              onClick={() => setSelectedUtility(u)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{u.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.description}</p>
              <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-secondary)' }}>
                {u.category}
              </div>
            </div>
          ))}
          {filteredUtilities.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
              No utilities found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
};

export default Dashboard;
