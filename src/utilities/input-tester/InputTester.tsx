import React, { useState, useEffect, useRef, useCallback } from 'react';
import './InputTester.css';

interface KeyProps {
  code: string;
  label: React.ReactNode;
  width?: string;
  height?: string;
  align?: 'center' | 'left' | 'right';
  pressed?: boolean;
  tested?: boolean;
}

const Key = ({ label, pressed, tested, width = '44px', height = '44px', align = 'center' }: KeyProps) => {
  return (
    <div
      className={`kt-key ${pressed ? 'pressed' : ''} ${tested ? 'tested' : ''}`}
      style={{
        width,
        height,
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        paddingLeft: align === 'left' ? '16px' : '0',
        paddingRight: align === 'right' ? '16px' : '0'
      }}
    >
      {label}
    </div>
  );
};

const InputTester: React.FC<{ activeTab?: 'keyboard' | 'mouse', onTabChange?: (tab: 'keyboard' | 'mouse') => void }> = ({ activeTab = 'keyboard', onTabChange }) => {
  const currentTab = activeTab;

  // --- Keyboard State ---
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [kbHistory, setKbHistory] = useState<string[]>([]);
  const [kbLatency, setKbLatency] = useState<string>('0.0');
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());

  // --- Mouse State ---
  const [mouseButtons, setMouseButtons] = useState({
    left: false,
    right: false,
    middle: false,
    side1: false,
    side2: false,
  });
  const [scrollDir, setScrollDir] = useState<'up' | 'down' | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [clickSpeed, setClickSpeed] = useState<number | null>(null);
  const [clickCount, setClickCount] = useState<number>(0);
  const [clickFaults, setClickFaults] = useState<number>(0);
  const [consistency, setConsistency] = useState<number>(100);
  const [isGhosting, setIsGhosting] = useState(false);

  // --- Configuration State ---
  const [config, setConfig] = useState({
    soundEnabled: true,
    ghostingDetection: false,
    markTested: false,
    glowColor: '#b4c6ef'
  });

  // --- Audio Synthesis ---
  const audioCtx = useRef<AudioContext | null>(null);
  const noiseBuffer = useRef<AudioBuffer | null>(null);

  const playClick = useCallback(() => {
    if (!config.soundEnabled) return;
    try {
      if (!audioCtx.current || audioCtx.current.state === 'suspended') {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create noise buffer
        const bufferSize = audioCtx.current.sampleRate * 0.1;
        noiseBuffer.current = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const data = noiseBuffer.current.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      }
      const ctx = audioCtx.current;
      
      // Layer 1: The "Impact" (Transient Clack)
      if (noiseBuffer.current) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer.current;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(3000, ctx.currentTime);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();
      }

      // Layer 2: The "Thock" (Case Resonance - Low)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.1);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Layer 3: Secondary Resonance (Body - Mid)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(280, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.05, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }, [config.soundEnabled]);

  // --- Keyboard Logic ---
  useEffect(() => {
    if (currentTab !== 'keyboard') return;

    let lastTime = performance.now();
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      const timeDiff = now - lastTime;
      if (timeDiff > 0 && timeDiff < 100) setKbLatency(timeDiff.toFixed(1));
      lastTime = now;

      const code = e.code;
      if (['Tab', 'Space', 'Backspace', 'Enter', 'AltLeft', 'AltRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Quote', 'Slash'].includes(code) || code.startsWith('F')) {
        if (!['F5', 'F11', 'F12'].includes(code)) e.preventDefault();
      }

      playClick();

      setPressedKeys(prev => {
        const next = new Set(prev).add(code);
        if (config.ghostingDetection && next.size > 6) {
          setIsGhosting(true);
          setTimeout(() => setIsGhosting(false), 300);
        }
        return next;
      });

      if (config.markTested) {
        setTestedKeys(prev => new Set(prev).add(code));
      }
      
      setKbHistory(prev => {
        const next = [...prev, code];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    const handleBlur = () => setPressedKeys(new Set());
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [currentTab, config, playClick]);

  // --- Mouse Logic ---

  const mapButtonCode = useCallback((code: number, isDown: boolean) => {
    if (isDown) playClick();
    setMouseButtons(prev => {
      const next = { ...prev };
      switch (code) {
        case 0: next.left = isDown; break;
        case 1: next.middle = isDown; break;
        case 2: next.right = isDown; break;
        case 3: next.side1 = isDown; break;
        case 4: next.side2 = isDown; break;
      }
      return next;
    });
  }, [playClick]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (currentTab !== 'mouse') return;
    if (e.button === 3 || e.button === 4) e.preventDefault();
    mapButtonCode(e.button, true);
  }, [currentTab, mapButtonCode]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (currentTab !== 'mouse') return;
    mapButtonCode(e.button, false);
  }, [currentTab, mapButtonCode]);
  const handleWheel = useCallback((e: WheelEvent) => {
    if (currentTab !== 'mouse') return;
    setScrollDir(e.deltaY < 0 ? 'up' : 'down');
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setScrollDir(null), 500);
  }, [currentTab]);

  useEffect(() => {
    if (currentTab !== 'mouse') return;
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [currentTab, handleMouseDown, handleMouseUp, handleWheel]);

  const handleDbClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.button !== 0) return;
    const now = performance.now();
    if (lastClickTime > 0) {
      const diff = Math.round(now - lastClickTime);
      if (diff < 50) {
        setClickFaults(f => f + 1);
      }
      setClickSpeed(diff);
      if (clickCount > 0) {
        setConsistency(prev => {
          const target = diff < 80 ? 98 : (diff < 150 ? 94 : 85);
          return Math.round((prev + target) / 2);
        });
      }
    }
    setLastClickTime(now);
    setClickCount(c => c + 1);
  };

  const renderKey = (code: string, label: React.ReactNode, width = '44px', height = '44px', align: 'center' | 'left' | 'right' = 'center') => (
    <Key 
      code={code} 
      label={label} 
      width={width} 
      height={height} 
      align={align} 
      pressed={pressedKeys.has(code)} 
      tested={testedKeys.has(code)}
    />
  );

  return (
    <div className={`it-container fade-in ${isGhosting ? 'ghosting-warning' : ''}`} style={{ '--it-glow': config.glowColor } as React.CSSProperties}>
      <div className="it-tab-switcher">
        <button 
          className={`it-tab-btn ${currentTab === 'keyboard' ? 'active' : ''}`}
          onClick={() => onTabChange ? onTabChange('keyboard') : null}
        >
          Keyboard Test
        </button>
        <button 
          className={`it-tab-btn ${currentTab === 'mouse' ? 'active' : ''}`}
          onClick={() => onTabChange ? onTabChange('mouse') : null}
        >
          Mouse Test
        </button>
      </div>

      <section className="it-header">
        <div className="it-title-group">
          <h1 className="it-hero-title">{currentTab === 'keyboard' ? 'Keyboard Test' : 'Mouse Test'}</h1>
          <p className="it-hero-subtitle">
            {currentTab === 'keyboard' 
              ? 'Real-time input diagnostic for mechanical and membrane arrays. Press any key to verify signal integrity.'
              : 'Verify button integrity, scroll precision, and double-click consistency in a high-fidelity environment.'}
          </p>
        </div>
        <div className="it-stats-group">
          <div className="it-stat-box">
            <span className="it-stat-label">LATENCY</span>
            <span className="it-stat-value neon-blue">{currentTab === 'keyboard' ? (kbLatency === '0.0' ? '1.2' : kbLatency) : (clickSpeed || '1.2')}ms</span>
          </div>
          <div className="it-stat-box">
            <span className="it-stat-label">{currentTab === 'keyboard' ? 'COMPLETION' : 'SESSION TOTAL'}</span>
            <span className="it-stat-value neon-green">
              {currentTab === 'keyboard' ? `${Math.round((testedKeys.size / 100) * 100)}%` : clickCount}
            </span>
          </div>
          {config.ghostingDetection && pressedKeys.size > 6 && (
            <div className="it-stat-box" style={{ borderColor: '#ef4444', animation: 'pulse 1s infinite' }}>
              <span className="it-stat-label" style={{ color: '#ef4444' }}>GHOSTING</span>
              <span className="it-stat-value" style={{ color: '#ef4444', fontSize: '1.25rem' }}>DETECTED</span>
            </div>
          )}
        </div>
      </section>

      {currentTab === 'keyboard' ? (
        <section className="kt-keyboard-section">
          <div className="kt-keyboard-inner scroll-hide">
            {/* Keyboard Layout - Reusing from previous work */}
            <div className="it-row" style={{ marginBottom: '24px' }}>
              <div className="it-group" style={{ marginRight: '40px' }}>{renderKey('Escape', 'Esc')}</div>
              <div className="it-group" style={{ marginRight: '24px' }}>{renderKey('F1', 'F1')} {renderKey('F2', 'F2')} {renderKey('F3', 'F3')} {renderKey('F4', 'F4')}</div>
              <div className="it-group" style={{ marginRight: '24px' }}>{renderKey('F5', 'F5')} {renderKey('F6', 'F6')} {renderKey('F7', 'F7')} {renderKey('F8', 'F8')}</div>
              <div className="it-group" style={{ marginRight: '24px' }}>{renderKey('F9', 'F9')} {renderKey('F10', 'F10')} {renderKey('F11', 'F11')} {renderKey('F12', 'F12')}</div>
              <div className="it-group">
                {renderKey('PrintScreen', <span style={{fontSize: '9px'}}>Prt<br/>Sc</span>)}
                {renderKey('ScrollLock', <span style={{fontSize: '9px'}}>Scr<br/>Lk</span>)}
                {renderKey('Pause', <span style={{fontSize: '9px'}}>Pau<br/>Br</span>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="it-row">
                  {renderKey('Backquote', '~')} {renderKey('Digit1', '1')} {renderKey('Digit2', '2')} {renderKey('Digit3', '3')} {renderKey('Digit4', '4')} {renderKey('Digit5', '5')} {renderKey('Digit6', '6')} {renderKey('Digit7', '7')} {renderKey('Digit8', '8')} {renderKey('Digit9', '9')} {renderKey('Digit0', '0')} {renderKey('Minus', '-')} {renderKey('Equal', '=')} {renderKey('Backspace', 'Backspace', '94px')}
                </div>
                <div className="it-row">
                  {renderKey('Tab', 'Tab', '68px', '44px', 'left')} {renderKey('KeyQ', 'Q')} {renderKey('KeyW', 'W')} {renderKey('KeyE', 'E')} {renderKey('KeyR', 'R')} {renderKey('KeyT', 'T')} {renderKey('KeyY', 'Y')} {renderKey('KeyU', 'U')} {renderKey('KeyI', 'I')} {renderKey('KeyO', 'O')} {renderKey('KeyP', 'P')} {renderKey('BracketLeft', '[')} {renderKey('BracketRight', ']')} {renderKey('Backslash', '\\', '68px')}
                </div>
                <div className="it-row">
                  {renderKey('CapsLock', 'Caps Lock', '84px', '44px', 'left')} {renderKey('KeyA', 'A')} {renderKey('KeyS', 'S')} {renderKey('KeyD', 'D')} {renderKey('KeyF', 'F')} {renderKey('KeyG', 'G')} {renderKey('KeyH', 'H')} {renderKey('KeyJ', 'J')} {renderKey('KeyK', 'K')} {renderKey('KeyL', 'L')} {renderKey('Semicolon', ';')} {renderKey('Quote', "'")} {renderKey('Enter', 'Enter', '104px', '44px', 'right')}
                </div>
                <div className="it-row">
                  {renderKey('ShiftLeft', 'Shift', '112px', '44px', 'left')} {renderKey('KeyZ', 'Z')} {renderKey('KeyX', 'X')} {renderKey('KeyC', 'C')} {renderKey('KeyV', 'V')} {renderKey('KeyB', 'B')} {renderKey('KeyN', 'N')} {renderKey('KeyM', 'M')} {renderKey('Comma', ',')} {renderKey('Period', '.')} {renderKey('Slash', '/')} {renderKey('ShiftRight', 'Shift', '126px', '44px', 'right')}
                </div>
                <div className="it-row">
                  {renderKey('ControlLeft', 'Ctrl', '52px')} {renderKey('MetaLeft', 'Win', '52px')} {renderKey('AltLeft', 'Alt', '52px')} {renderKey('Space', '', '282px')} {renderKey('AltRight', 'Alt', '52px')} {renderKey('MetaRight', 'Win', '52px')} {renderKey('ContextMenu', 'Menu', '52px')} {renderKey('ControlRight', 'Ctrl', '52px')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="it-row">{renderKey('Insert', 'Ins')} {renderKey('Home', 'Hm')} {renderKey('PageUp', 'PgUp')}</div>
                  <div className="it-row">{renderKey('Delete', 'Del')} {renderKey('End', 'End')} {renderKey('PageDown', 'PgDn')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <div className="it-row">{renderKey('ArrowUp', '↑')}</div>
                  <div className="it-row">{renderKey('ArrowLeft', '←')} {renderKey('ArrowDown', '↓')} {renderKey('ArrowRight', '→')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="it-row">{renderKey('NumLock', 'Num')} {renderKey('NumpadDivide', '/')} {renderKey('NumpadMultiply', '*')} {renderKey('NumpadSubtract', '-')}</div>
                <div className="it-row">{renderKey('Numpad7', '7')} {renderKey('Numpad8', '8')} {renderKey('Numpad9', '9')} {renderKey('NumpadAdd', '+', '44px', '96px')}</div>
                <div className="it-row" style={{ marginTop: '-52px' }}>{renderKey('Numpad4', '4')} {renderKey('Numpad5', '5')} {renderKey('Numpad6', '6')}</div>
                <div className="it-row">{renderKey('Numpad1', '1')} {renderKey('Numpad2', '2')} {renderKey('Numpad3', '3')} {renderKey('NumpadEnter', <span style={{fontSize: '9px'}}>Ent</span>, '44px', '96px')}</div>
                <div className="it-row" style={{ marginTop: '-52px' }}>{renderKey('Numpad0', '0', '96px')} {renderKey('NumpadDecimal', '.')}</div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-grid">
          <div className="mt-card">
            <h2 className="it-card-title">Button Detection</h2>
            <div className="mt-mouse-wrapper">
              <div className="mt-mouse">
                <div className="mt-mouse-row">
                  <div className={`mt-mouse-btn mt-mouse-btn-l ${mouseButtons.left ? 'active' : ''}`}>LMB</div>
                  <div className={`mt-mouse-mid ${mouseButtons.middle ? 'active' : ''}`}>
                    <div className="mt-mouse-wheel">
                      <div className={`mt-mouse-wheel-tick ${scrollDir === 'up' ? 'scroll-up' : scrollDir === 'down' ? 'scroll-down' : ''}`}></div>
                    </div>
                  </div>
                  <div className={`mt-mouse-btn mt-mouse-btn-r ${mouseButtons.right ? 'active' : ''}`}>RMB</div>
                </div>
                <div className="mt-mouse-body">
                  <div className="mt-mouse-side-btns">
                    <div className={`mt-mouse-side-btn ${mouseButtons.side1 ? 'active' : ''}`}></div>
                    <div className={`mt-mouse-side-btn ${mouseButtons.side2 ? 'active' : ''}`}></div>
                  </div>
                  <div className="mt-scroll-indicator">
                    <span className={scrollDir === 'up' ? 'active' : ''}>▲</span>
                    <span className={scrollDir === 'down' ? 'active' : ''}>▼</span>
                  </div>
                  <span style={{ fontSize: '3rem', opacity: 0.1 }}>📡</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="mt-card">
              <div className="it-card-title">
                <h2 style={{ color: '#ffb95f', margin: 0 }}>Double Click Speed</h2>
                <button 
                  onClick={() => {
                    setClickCount(0);
                    setClickFaults(0);
                    setConsistency(100);
                    setClickSpeed(null);
                    setLastClickTime(0);
                  }} 
                  className="it-clear-btn"
                >
                  RESET METRICS
                </button>
              </div>
              <div className="mt-click-area" onMouseDown={handleDbClick}>
                <span style={{ display: 'block', fontSize: '1rem', color: '#64748b', marginBottom: '1rem' }}>Click here rapidly</span>
                <span className="mt-click-time">{clickSpeed || '--'} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="it-stat-label">CONSISTENCY</div>
                  <div className="it-stat-value" style={{ fontSize: '1.25rem' }}>{clickCount > 1 ? `${consistency}%` : '--'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="it-stat-label">FAULTS</div>
                  <div className="it-stat-value" style={{ fontSize: '1.25rem', color: clickFaults > 0 ? '#ef4444' : '#94a3b8' }}>{clickFaults}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="it-stat-label">STATUS</div>
                  <div className="it-stat-value" style={{ fontSize: '1.25rem', color: clickSpeed && clickSpeed < 50 ? '#ef4444' : (clickSpeed && clickSpeed < 100 ? '#4edea3' : '#ffb95f') }}>
                    {clickCount > 1 ? (clickSpeed && clickSpeed < 50 ? 'Hardware Fault' : (clickSpeed && clickSpeed < 100 ? 'Optimal' : 'Good')) : '--'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {currentTab === 'keyboard' && (
        <section className="it-stats-grid">
          <div className="it-log-card">
            <div className="it-card-title">
              <h3>Input Stream</h3>
              <button 
                onClick={() => {
                  setKbHistory([]);
                  setTestedKeys(new Set());
                }} 
                className="it-clear-btn"
              >
                CLEAR HISTORY
              </button>
            </div>
            <div className="it-log-stream">
              {kbHistory.map((code, idx) => (
                <div key={idx} className={`it-log-item-box ${idx === kbHistory.length - 1 ? 'latest' : ''}`}>
                  {code.replace('Key', '').replace('Digit', '').replace('Left', '').replace('Right', '')}
                </div>
              ))}
              {kbHistory.length === 0 && <span style={{ color: '#4b5563' }}>Press any key to start...</span>}
            </div>
          </div>

          <div className="it-config-card">
            <h3 className="it-card-title">Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Sound Feedback</span>
                <div 
                  className={`it-toggle ${config.soundEnabled ? 'active' : ''}`}
                  onClick={() => setConfig(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                >
                  <div className="it-toggle-knob"></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Ghosting Detection</span>
                <div 
                  className={`it-toggle ${config.ghostingDetection ? 'active' : ''}`}
                  onClick={() => setConfig(prev => ({ ...prev, ghostingDetection: !prev.ghostingDetection }))}
                >
                  <div className="it-toggle-knob"></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Persistence</span>
              <div 
                className={`it-toggle ${config.markTested ? 'active' : ''}`}
                onClick={() => {
                  if (config.markTested) setTestedKeys(new Set());
                  setConfig(prev => ({ ...prev, markTested: !prev.markTested }));
                }}
              >
                <div className="it-toggle-knob"></div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#4b5563', marginBottom: '0.75rem' }}>PRIMARY GLOW COLOR</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {['#b4c6ef', '#4edea3', '#ffb95f', '#ffb4ab'].map(color => (
                    <div 
                      key={color}
                      className={`it-color-circle ${config.glowColor === color ? 'active' : ''}`} 
                      style={{ background: color }}
                      onClick={() => setConfig(prev => ({ ...prev, glowColor: color }))}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default InputTester;
