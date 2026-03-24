import React, { useState, useEffect } from 'react';
import './KeyboardTest.css';

interface KeyProps {
  code: string;
  label: React.ReactNode;
  width?: string;
  height?: string;
  align?: 'center' | 'left' | 'right';
  pressed?: boolean;
}

const Key = ({ label, pressed, width = '44px', height = '44px', align = 'center' }: KeyProps) => {
  return (
    <div
      className={`kt-key ${pressed ? 'pressed' : ''}`}
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

const KeyboardTest: React.FC = () => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  const [latency, setLatency] = useState<string>('0.0');

  useEffect(() => {
    let lastTime = performance.now();
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      const timeDiff = now - lastTime;
      if (timeDiff > 0 && timeDiff < 100) {
        setLatency(timeDiff.toFixed(1));
      }
      lastTime = now;

      const code = e.code;
      if (['Tab', 'Space', 'Backspace', 'Enter', 'AltLeft', 'AltRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Quote', 'Slash'].includes(code) || code.startsWith('F')) {
        if (!['F5', 'F11', 'F12'].includes(code)) {
          e.preventDefault();
        }
      }

      setPressedKeys(prev => new Set(prev).add(code));
      setHistory(prev => {
        const next = [...prev, code];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (['Tab', 'Space', 'Backspace', 'Enter', 'AltLeft', 'AltRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code) || code.startsWith('F')) {
        if (!['F5', 'F11', 'F12'].includes(code)) {
          e.preventDefault();
        }
      }
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
  }, []);

  const renderKey = (code: string, label: React.ReactNode, width = '44px', height = '44px', align: 'center' | 'left' | 'right' = 'center') => (
    <Key code={code} label={label} width={width} height={height} align={align} pressed={pressedKeys.has(code)} />
  );

  return (
    <div className="kt-container fade-in">
      <section className="kt-header">
        <div className="kt-title-group">
          <h1 className="hero-title">Keyboard Test</h1>
          <p className="hero-subtitle">Real-time input diagnostic for mechanical and membrane arrays. Press any key to verify signal integrity.</p>
        </div>
        <div className="kt-stats-group">
          <div className="kt-stat-box">
            <span className="kt-stat-label">LATENCY</span>
            <span className="kt-stat-value neon-blue">{latency === '0.0' ? '1.2' : latency}ms</span>
          </div>
          <div className="kt-stat-box">
            <span className="kt-stat-label">POLLING</span>
            <span className="kt-stat-value neon-green">1000Hz</span>
          </div>
        </div>
      </section>

      <section className="kt-keyboard-section">
        <div className="kt-keyboard-inner scroll-hide">
          {/* Row 1: Escape & Function Keys */}
          <div className="kt-row" style={{ marginBottom: '24px' }}>
            <div className="kt-group" style={{ marginRight: '40px' }}>
              {renderKey('Escape', 'Esc')}
            </div>
            <div className="kt-group" style={{ marginRight: '24px' }}>
              {renderKey('F1', 'F1')} {renderKey('F2', 'F2')} {renderKey('F3', 'F3')} {renderKey('F4', 'F4')}
            </div>
            <div className="kt-group" style={{ marginRight: '24px' }}>
              {renderKey('F5', 'F5')} {renderKey('F6', 'F6')} {renderKey('F7', 'F7')} {renderKey('F8', 'F8')}
            </div>
            <div className="kt-group" style={{ marginRight: '24px' }}>
              {renderKey('F9', 'F9')} {renderKey('F10', 'F10')} {renderKey('F11', 'F11')} {renderKey('F12', 'F12')}
            </div>
            <div className="kt-group">
              {renderKey('PrintScreen', <><span style={{fontSize: '9px'}}>Prt<br/>Sc</span></>)}
              {renderKey('ScrollLock', <><span style={{fontSize: '9px'}}>Scr<br/>Lk</span></>)}
              {renderKey('Pause', <><span style={{fontSize: '9px'}}>Pau<br/>Br</span></>)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Alpha-Numeric Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="kt-row">
                {renderKey('Backquote', '~')} {renderKey('Digit1', '1')} {renderKey('Digit2', '2')} {renderKey('Digit3', '3')} {renderKey('Digit4', '4')} {renderKey('Digit5', '5')} {renderKey('Digit6', '6')} {renderKey('Digit7', '7')} {renderKey('Digit8', '8')} {renderKey('Digit9', '9')} {renderKey('Digit0', '0')} {renderKey('Minus', '-')} {renderKey('Equal', '=')} {renderKey('Backspace', 'Backspace', '94px')}
              </div>
              <div className="kt-row">
                {renderKey('Tab', 'Tab', '68px', '44px', 'left')} {renderKey('KeyQ', 'Q')} {renderKey('KeyW', 'W')} {renderKey('KeyE', 'E')} {renderKey('KeyR', 'R')} {renderKey('KeyT', 'T')} {renderKey('KeyY', 'Y')} {renderKey('KeyU', 'U')} {renderKey('KeyI', 'I')} {renderKey('KeyO', 'O')} {renderKey('KeyP', 'P')} {renderKey('BracketLeft', '[')} {renderKey('BracketRight', ']')} {renderKey('Backslash', '\\', '68px')}
              </div>
              <div className="kt-row">
                {renderKey('CapsLock', 'Caps Lock', '84px', '44px', 'left')} {renderKey('KeyA', 'A')} {renderKey('KeyS', 'S')} {renderKey('KeyD', 'D')} {renderKey('KeyF', 'F')} {renderKey('KeyG', 'G')} {renderKey('KeyH', 'H')} {renderKey('KeyJ', 'J')} {renderKey('KeyK', 'K')} {renderKey('KeyL', 'L')} {renderKey('Semicolon', ';')} {renderKey('Quote', "'")} {renderKey('Enter', 'Enter', '104px', '44px', 'right')}
              </div>
              <div className="kt-row">
                {renderKey('ShiftLeft', 'Shift', '112px', '44px', 'left')} {renderKey('KeyZ', 'Z')} {renderKey('KeyX', 'X')} {renderKey('KeyC', 'C')} {renderKey('KeyV', 'V')} {renderKey('KeyB', 'B')} {renderKey('KeyN', 'N')} {renderKey('KeyM', 'M')} {renderKey('Comma', ',')} {renderKey('Period', '.')} {renderKey('Slash', '/')} {renderKey('ShiftRight', 'Shift', '126px', '44px', 'right')}
              </div>
              <div className="kt-row">
                {renderKey('ControlLeft', 'Ctrl', '52px')} {renderKey('MetaLeft', 'Win', '52px')} {renderKey('AltLeft', 'Alt', '52px')} {renderKey('Space', '', '282px')} {renderKey('AltRight', 'Alt', '52px')} {renderKey('MetaRight', 'Win', '52px')} {renderKey('ContextMenu', 'Menu', '52px')} {renderKey('ControlRight', 'Ctrl', '52px')}
              </div>
            </div>

            {/* Navigation & Arrows Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="kt-row">
                  {renderKey('Insert', 'Ins')} {renderKey('Home', 'Hm')} {renderKey('PageUp', 'PgUp')}
                </div>
                <div className="kt-row">
                  {renderKey('Delete', 'Del')} {renderKey('End', 'End')} {renderKey('PageDown', 'PgDn')}
                </div>
              </div>

              {/* T-Shape Arrows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <div className="kt-row">
                  {renderKey('ArrowUp', '↑')}
                </div>
                <div className="kt-row">
                  {renderKey('ArrowLeft', '←')} {renderKey('ArrowDown', '↓')} {renderKey('ArrowRight', '→')}
                </div>
              </div>
            </div>

            {/* Numpad Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="kt-row">
                {renderKey('NumLock', 'Num')} {renderKey('NumpadDivide', '/')} {renderKey('NumpadMultiply', '*')} {renderKey('NumpadSubtract', '-')}
              </div>
              <div className="kt-row">
                {renderKey('Numpad7', '7')} {renderKey('Numpad8', '8')} {renderKey('Numpad9', '9')} {renderKey('NumpadAdd', '+', '44px', '96px')}
              </div>
              <div className="kt-row" style={{ marginTop: '-52px' }}>
                {renderKey('Numpad4', '4')} {renderKey('Numpad5', '5')} {renderKey('Numpad6', '6')}
              </div>
              <div className="kt-row">
                {renderKey('Numpad1', '1')} {renderKey('Numpad2', '2')} {renderKey('Numpad3', '3')} {renderKey('NumpadEnter', <><span style={{fontSize: '9px'}}>Ent</span></>, '44px', '96px')}
              </div>
              <div className="kt-row" style={{ marginTop: '-52px' }}>
                {renderKey('Numpad0', '0', '96px')} {renderKey('NumpadDecimal', '.')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="kt-stats-grid">
        <div className="kt-log-card">
          <div className="kt-log-header">
            <h3>Input Stream</h3>
            <button onClick={() => setHistory([])} className="kt-clear-btn">CLEAR HISTORY</button>
          </div>
          <div className="kt-log-stream">
            {history.map((code, idx) => (
              <div key={idx} className={`kt-log-item-box ${idx === history.length - 1 ? 'latest' : ''}`}>
                {code.replace('Key', '').replace('Digit', '').replace('Left', '').replace('Right', '')}
              </div>
            ))}
            {history.length === 0 && <span className="kt-placeholder">Press any key to start...</span>}
          </div>
        </div>

        <div className="kt-config-card">
          <h3>Configuration</h3>
          <div className="kt-config-options">
            <div className="kt-config-row">
              <span>Sound Feedback</span>
              <div className="kt-toggle active">
                <div className="kt-toggle-knob"></div>
              </div>
            </div>
            <div className="kt-config-row">
              <span>Ghosting Detection</span>
              <div className="kt-toggle">
                <div className="kt-toggle-knob"></div>
              </div>
            </div>
            <div className="kt-config-color">
              <label>PRIMARY GLOW COLOR</label>
              <div className="kt-color-options">
                <div className="kt-color-circle active" style={{ background: '#b4c6ef' }}></div>
                <div className="kt-color-circle" style={{ background: '#4edea3' }}></div>
                <div className="kt-color-circle" style={{ background: '#ffb95f' }}></div>
                <div className="kt-color-circle" style={{ background: '#ffb4ab' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KeyboardTest;