import React, { useState } from 'react';
import '../../styles/global.css';

const MAX_CHARS = 20000;

const GrammarChecker: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setText(newText);
      // Reset matches if text changes after a check?
      // Maybe not immediately, but could be good to indicate it's out of sync.
    }
  };

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setMatches([]);
    setHasChecked(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const params = new URLSearchParams();
      params.append('text', text);
      params.append('language', 'en-US'); // Force English to ensure grammar rules run
      params.append('enabledRules', 'ARTICLE_MISSING,EN_A_VS_AN,MISSING_ARTICLE,EN_UNCOUNTABLE_A,CD_NN,A_N_IN');
      params.append('level', 'picky'); // Activate additional formal grammar and style rules

      const response = await fetch('https://api.languagetoolplus.com/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }

      if (!response.ok) {
        throw new Error('SERVER_ERROR');
      }

      const data = await response.json();
      setMatches(data.matches || []);
      setHasChecked(true);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err.message === 'RATE_LIMIT') {
        setError('Rate limit reached. Please wait a minute before trying again.');
      } else {
        setError('Unable to reach the grammar check server. Please check your internet connection and try again.');
      }
      console.error('Grammar check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setMatches([]);
    setError(null);
    setHasChecked(false);
    setSelectedMatch(null);
  };

  const applySuggestion = (match: any, suggestion: string) => {
    const newText = text.substring(0, match.offset) + suggestion + text.substring(match.offset + match.length);
    setText(newText);

    // Update remaining matches offsets
    const diff = suggestion.length - match.length;
    const newMatches = matches
      .filter(m => m !== match)
      .map(m => {
        if (m.offset > match.offset) {
          return { ...m, offset: m.offset + diff };
        }
        return m;
      });

    setMatches(newMatches);
    setSelectedMatch(null);
  };

  const autoFixAll = () => {
    let currentText = text;
    let offsetAdjustment = 0;
    
    const sortedMatches = [...matches].sort((a, b) => a.offset - b.offset);
    
    sortedMatches.forEach(match => {
      if (match.replacements && match.replacements.length > 0) {
        const suggestion = match.replacements[0].value;
        const adjustedOffset = match.offset + offsetAdjustment;
        
        currentText = currentText.substring(0, adjustedOffset) + suggestion + currentText.substring(adjustedOffset + match.length);
        offsetAdjustment += suggestion.length - match.length;
      }
    });
    
    setText(currentText);
    setMatches([]);
    setHasChecked(false); // Switch back to edit mode
    setSelectedMatch(null);
  };


  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const renderTextWithHighlights = () => {
    if (matches.length === 0) return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{text}</div>;

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort matches by offset to ensure sequential processing
    const sortedMatches = [...matches].sort((a, b) => a.offset - b.offset);

    sortedMatches.forEach((match, index) => {
      // Add text before the match
      if (match.offset > lastIndex) {
        segments.push(text.substring(lastIndex, match.offset));
      }

      // Add the highlighted match
      const matchText = text.substring(match.offset, match.offset + match.length);
      segments.push(
        <span
          key={`match-${index}`}
          onClick={() => setSelectedMatch(match)}
          title={match.message}
          style={{
            background: selectedMatch === match ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            borderBottom: `2px solid ${selectedMatch === match ? 'var(--accent-primary)' : '#ef4444'}`,
            cursor: 'pointer',
            borderRadius: '2px',
            padding: '1px 0',
            transition: 'all 0.2s ease'
          }}
        >
          {matchText}
        </span>
      );

      lastIndex = match.offset + match.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push(text.substring(lastIndex));
    }

    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{segments}</div>;
  };

  return (
    <div className="glass-card fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>✍️</div>
          <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>Grammar Checker</h2>
        </div>
        <div style={{
          fontSize: '0.75rem',
          background: 'rgba(56, 189, 248, 0.1)',
          color: 'var(--accent-primary)',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          fontWeight: '500'
        }}>
          🌐 Requires Internet Connection
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        {!hasChecked || matches.length === 0 ? (
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Paste or type your text here to check for grammar and spelling errors..."
            style={{
              width: '100%',
              height: '300px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              color: 'var(--text-primary)',
              padding: '1.25rem',
              fontSize: '1rem',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        ) : (
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>ℹ️</span> Click on the highlighted text below to see suggestions.
            </div>
            <div style={{
              width: '100%',
              minHeight: '300px',
              maxHeight: '500px',
              overflowY: 'auto',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '1rem',
              color: 'var(--text-primary)',
              padding: '1.25rem',
              fontSize: '1rem',
              lineHeight: '1.6',
            }}>
              {renderTextWithHighlights()}
            </div>
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1.25rem',
          fontSize: '0.8rem',
          color: text.length >= MAX_CHARS ? '#f87171' : 'var(--text-secondary)',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.2rem 0.5rem',
          borderRadius: '0.4rem',
          backdropFilter: 'blur(4px)',
          zIndex: 10
        }}>
          {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          borderRadius: '0.75rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {selectedMatch && (
        <div className="fade-in" style={{
          marginBottom: '1.5rem',
          padding: '1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {selectedMatch.rule.category.name}
            </span>
            <button
              onClick={() => setSelectedMatch(null)}
              style={{ background: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            {selectedMatch.message}
          </p>

          {selectedMatch.replacements && selectedMatch.replacements.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedMatch.replacements.slice(0, 5).map((rep: any, i: number) => (
                <button
                  key={i}
                  onClick={() => applySuggestion(selectedMatch, rep.value)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--bg-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                >
                  {rep.value}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hasChecked && matches.length === 0 && !error && (
        <div className="fade-in" style={{
          padding: '1.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          borderRadius: '0.75rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          Looking good! No grammar errors found. 🎉
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={handleCheck}
          disabled={loading || !text.trim()}
          style={{
            flex: 2,
            background: loading || !text.trim() ? 'rgba(56, 189, 248, 0.3)' : 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            padding: '1rem',
            fontSize: '1rem',
            borderRadius: '0.75rem',
            fontWeight: 'bold',
            cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(15, 23, 42, 0.3)',
                borderTopColor: 'var(--bg-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Checking...
            </>
          ) : (
            <>🔍 {hasChecked ? 'Re-check Text' : 'Check Text'}</>
          )}
        </button>
        {hasChecked && matches.length > 0 && (
          <button
            onClick={autoFixAll}
            style={{
              flex: 1,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              padding: '1rem',
              fontSize: '1rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            ✨ Fix All
          </button>
        )}
        {hasChecked && (
          <button
            onClick={copyToClipboard}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
              padding: '1rem',
              fontSize: '1rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              border: '1px solid var(--border-color)',
            }}
          >
            📋 Copy
          </button>
        )}
        <button
          onClick={handleClear}
          disabled={loading || !text}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            padding: '1rem',
            fontSize: '1rem',
            borderRadius: '0.75rem',
            fontWeight: '600',
            border: '1px solid var(--border-color)',
            cursor: loading || !text ? 'not-allowed' : 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>ℹ️</span>
          <span>Powered by LanguageTool. Your text is sent to their servers for processing.</span>
        </div>
      </div>

      {showToast && (
        <div className="fade-in" style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(16, 185, 129, 0.9)',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: '2rem',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          fontWeight: '500',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          Copied to clipboard! 📋
        </div>
      )}
    </div>
  );
};

export default GrammarChecker;
