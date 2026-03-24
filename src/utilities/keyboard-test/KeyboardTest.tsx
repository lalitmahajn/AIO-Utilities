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

const Key = ({ label, pressed, width = '48px', height = '48px', align = 'center' }: KeyProps) => {
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

  const renderKey = (code: string, label: React.ReactNode, width = '48px', height = '48px', align: 'center' | 'left' | 'right' = 'center') => (
    <Key code={code} label={label} width={width} height={height} align={align} pressed={pressedKeys.has(code)} />
  );

  return (
    <div className="kt-container fade-in">
      <section className="kt-header">
        <div className="kt-title-group">
          <h1 className="hero-title">Keyboard Test</h1>
          <p className="hero-subtitle" style={{ maxWidth: '600px', fontSize: '1rem', marginTop: '0.5rem', marginBottom: '0' }}>Real-time input diagnostic for mechanical and membrane arrays. Press any key to verify signal integrity.</p>
        </div>
        <div className="kt-stats-group">
          <div className="kt-stat-box">
            <span className="kt-stat-label" style={{ color: 'var(--accent-primary)' }}>Latency</span>
            <span className="kt-stat-value kt-neon-glow">{latency}ms</span>
          </div>
          <div className="kt-stat-box">
            <span className="kt-stat-label" style={{ color: '#4edea3' }}>Polling</span>
            <span className="kt-stat-value" style={{ color: '#4edea3' }}>1000Hz</span>
          </div>
        </div>
      </section>

      <section className="kt-keyboard-section">
        <div className="kt-keyboard-glow-1"></div>
        <div className="kt-keyboard-glow-2"></div>

        <div className="kt-keyboard-inner scroll-hide">
          {/* Row 1: Function Keys */}
          <div className="kt-row" style={{ marginBottom: '16px' }}>
            <div className="kt-group" style={{ marginRight: '64px' }}>
              {renderKey('Escape', 'Esc')}
            </div>
            <div className="kt-group" style={{ marginRight: '32px' }}>
              {renderKey('F1', 'F1')} {renderKey('F2', 'F2')} {renderKey('F3', 'F3')} {renderKey('F4', 'F4')}
            </div>
            <div className="kt-group" style={{ marginRight: '32px' }}>
              {renderKey('F5', 'F5')} {renderKey('F6', 'F6')} {renderKey('F7', 'F7')} {renderKey('F8', 'F8')}
            </div>
            <div className="kt-group" style={{ marginRight: '32px' }}>
              {renderKey('F9', 'F9')} {renderKey('F10', 'F10')} {renderKey('F11', 'F11')} {renderKey('F12', 'F12')}
            </div>
            <div className="kt-group">
              {renderKey('PrintScreen', <><span style={{fontSize: '10px', textAlign: 'center'}}>Prt<br/>Sc</span></>)}
              {renderKey('ScrollLock', <><span style={{fontSize: '10px', textAlign: 'center'}}>Scr<br/>Lk</span></>)}
              {renderKey('Pause', <><span style={{fontSize: '10px', textAlign: 'center'}}>Pau<br/>Br</span></>)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '40px' }}>
            {/* Alpha-Numeric Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="kt-row">
                {renderKey('Backquote', '~')} {renderKey('Digit1', '1')} {renderKey('Digit2', '2')} {renderKey('Digit3', '3')} {renderKey('Digit4', '4')} {renderKey('Digit5', '5')} {renderKey('Digit6', '6')} {renderKey('Digit7', '7')} {renderKey('Digit8', '8')} {renderKey('Digit9', '9')} {renderKey('Digit0', '0')} {renderKey('Minus', '-')} {renderKey('Equal', '=')} {renderKey('Backspace', 'Backspace', '104px', '48px', 'right')}
              </div>
              <div className="kt-row">
                {renderKey('Tab', 'Tab', '76px', '48px', 'left')} {renderKey('KeyQ', 'Q')} {renderKey('KeyW', 'W')} {renderKey('KeyE', 'E')} {renderKey('KeyR', 'R')} {renderKey('KeyT', 'T')} {renderKey('KeyY', 'Y')} {renderKey('KeyU', 'U')} {renderKey('KeyI', 'I')} {renderKey('KeyO', 'O')} {renderKey('KeyP', 'P')} {renderKey('BracketLeft', '[')} {renderKey('BracketRight', ']')} {renderKey('Backslash', '\\', '76px', '48px', 'center')}
              </div>
              <div className="kt-row">
                {renderKey('CapsLock', 'Caps Lock', '92px', '48px', 'left')} {renderKey('KeyA', 'A')} {renderKey('KeyS', 'S')} {renderKey('KeyD', 'D')} {renderKey('KeyF', 'F')} {renderKey('KeyG', 'G')} {renderKey('KeyH', 'H')} {renderKey('KeyJ', 'J')} {renderKey('KeyK', 'K')} {renderKey('KeyL', 'L')} {renderKey('Semicolon', ';')} {renderKey('Quote', "'")} {renderKey('Enter', 'Enter', '116px', '48px', 'right')}
              </div>
              <div className="kt-row">
                {renderKey('ShiftLeft', 'Shift', '124px', '48px', 'left')} {renderKey('KeyZ', 'Z')} {renderKey('KeyX', 'X')} {renderKey('KeyC', 'C')} {renderKey('KeyV', 'V')} {renderKey('KeyB', 'B')} {renderKey('KeyN', 'N')} {renderKey('KeyM', 'M')} {renderKey('Comma', ',')} {renderKey('Period', '.')} {renderKey('Slash', '/')} {renderKey('ShiftRight', 'Shift', '140px', '48px', 'right')}
              </div>
              <div className="kt-row">
                {renderKey('ControlLeft', 'Ctrl', '60px', '48px')} {renderKey('MetaLeft', 'Win', '60px', '48px')} {renderKey('AltLeft', 'Alt', '60px', '48px')} {renderKey('Space', '', '316px', '48px')} {renderKey('AltRight', 'Alt', '60px', '48px')} {renderKey('MetaRight', 'Win', '60px', '48px')} {renderKey('ContextMenu', 'Menu', '60px', '48px')} {renderKey('ControlRight', 'Ctrl', '60px', '48px')}
              </div>
            </div>

            {/* Navigation & Arrows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="kt-row">
                {renderKey('Insert', <><span style={{fontSize: '10px'}}>Ins</span></>)} {renderKey('Home', <><span style={{fontSize: '10px'}}>Hm</span></>)} {renderKey('PageUp', <><span style={{fontSize: '10px'}}>PgUp</span></>)}
              </div>
              <div className="kt-row">
                {renderKey('Delete', <><span style={{fontSize: '10px'}}>Del</span></>)} {renderKey('End', <><span style={{fontSize: '10px'}}>End</span></>)} {renderKey('PageDown', <><span style={{fontSize: '10px'}}>PgDn</span></>)}
              </div>
              <div style={{ height: '48px' }}></div>
              <div className="kt-row" style={{ justifyContent: 'center' }}>
                {renderKey('ArrowUp', '↑')}
              </div>
              <div className="kt-row">
                {renderKey('ArrowLeft', '←')} {renderKey('ArrowDown', '↓')} {renderKey('ArrowRight', '→')}
              </div>
            </div>

            {/* Numpad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="kt-row">
                {renderKey('NumLock', <><span style={{fontSize: '10px'}}>Num</span></>)} {renderKey('NumpadDivide', '/')} {renderKey('NumpadMultiply', '*')} {renderKey('NumpadSubtract', '-')}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="kt-row">
                    {renderKey('Numpad7', '7')} {renderKey('Numpad8', '8')} {renderKey('Numpad9', '9')}
                  </div>
                  <div className="kt-row">
                    {renderKey('Numpad4', '4')} {renderKey('Numpad5', '5')} {renderKey('Numpad6', '6')}
                  </div>
                </div>
                <div>
                  {renderKey('NumpadAdd', '+', '48px', '104px')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="kt-row">
                    {renderKey('Numpad1', '1')} {renderKey('Numpad2', '2')} {renderKey('Numpad3', '3')}
                  </div>
                  <div className="kt-row">
                    {renderKey('Numpad0', '0', '104px', '48px')} {renderKey('NumpadDecimal', '.')}
                  </div>
                </div>
                <div>
                  {renderKey('NumpadEnter', <><span style={{fontSize: '10px'}}>Ent</span></>, '48px', '104px')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="kt-stats-grid">
        <div className="kt-log-card">
          <div className="kt-log-header">
            <h3>Input Stream</h3>
            <button onClick={() => setHistory([])} className="kt-clear-btn">Clear History</button>
          </div>
          <div className="kt-log-stream">
            {history.map((code, idx) => (
              <div key={idx} className={`kt-log-item ${idx === history.length - 1 ? 'kt-log-item-latest' : ''}`}>
                {code}
              </div>
            ))}
            {history.length === 0 && <span style={{ opacity: 0.5 }}>Press any key to start...</span>}
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
              <label>Primary Glow Color</label>
              <div className="kt-color-options">
                <div className="kt-color-option active" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                <div className="kt-color-option" style={{ backgroundColor: '#4edea3' }}></div>
                <div className="kt-color-option" style={{ backgroundColor: '#ffb95f' }}></div>
                <div className="kt-color-option" style={{ backgroundColor: '#ffb4ab' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KeyboardTest;