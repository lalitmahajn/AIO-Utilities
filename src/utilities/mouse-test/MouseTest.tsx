import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MouseTest.css';

interface ButtonState {
  left: boolean;
  right: boolean;
  middle: boolean;
  side1: boolean;
  side2: boolean;
}

const MouseTest: React.FC = () => {
  // Button States
  const [buttons, setButtons] = useState<ButtonState>({
    left: false,
    right: false,
    middle: false,
    side1: false,
    side2: false,
  });

  // Double Click State
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [clickSpeed, setClickSpeed] = useState<number | null>(null);
  const [consistency, setConsistency] = useState<number>(100);
  const [clickCount, setClickCount] = useState<number>(0);

  // Scroll State
  const [scrollDelta, setScrollDelta] = useState<number>(0);
  const [scrollDir, setScrollDir] = useState<'Up' | 'Down' | 'None'>('None');
  const [scrollPosition, setScrollPosition] = useState<number>(50); // 0-100%

  // Polling Rate State
  const [pollingRate, setPollingRate] = useState<number>(0);
  const lastMoveTimes = useRef<number[]>([]);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Prevent context menu to allow right click testing
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Prevent default scrolling when testing the wheel on the container
  const handleWheel = useCallback((e: React.WheelEvent<HTMLElement>) => {
    setScrollDelta(e.deltaY);
    setScrollDir(e.deltaY > 0 ? 'Down' : 'Up');

    // Animate scroll bar based on delta
    setScrollPosition(prev => {
      let next = prev + (e.deltaY > 0 ? 5 : -5);
      if (next > 100) next = 100;
      if (next < 0) next = 0;
      return next;
    });

    // Reset scroll delta visually after a short delay
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      setScrollDir('None');
    }, 150);
  }, []);

  // Global Mouse Move for Polling Rate
  const handleMouseMove = useCallback(() => {
    const now = performance.now();
    lastMoveTimes.current.push(now);

    // Keep only last 100ms of events
    if (lastMoveTimes.current.length > 0) {
      const threshold = now - 100;
      lastMoveTimes.current = lastMoveTimes.current.filter(t => t > threshold);
    }
  }, []);

  // Calculate polling rate every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();

      // Clean up array first to remove old events before calculating
      const threshold = now - 100;
      lastMoveTimes.current = lastMoveTimes.current.filter(t => t > threshold);

      // If we have 100ms of data, events * 10 is approx Hz
      const count = lastMoveTimes.current.length;
      if (count > 0) {
        setPollingRate(count * 10);
      } else {
        setPollingRate(0);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Global event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  const mapButtonCode = (code: number, isDown: boolean) => {
    setButtons(prev => {
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
  };

  const handleGlobalMouseDown = useCallback((e: MouseEvent) => {
    // We only want to capture global events if we are focused on testing,
    // but typically we attach to a specific div so it doesn't break the whole app.
    // For this, we'll map buttons but won't prevent default unless on our component.

    // Prevent default for side buttons to prevent browser back/forward navigation
    if (e.button === 3 || e.button === 4) {
      e.preventDefault();
    }

    mapButtonCode(e.button, true);
  }, []);

  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    mapButtonCode(e.button, false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleGlobalMouseDown);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleGlobalMouseDown);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseDown, handleGlobalMouseUp]);


  const handleDoubleClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.button !== 0) return; // only left click for this test

    const now = performance.now();
    if (lastClickTime > 0) {
      const diff = Math.round(now - lastClickTime);
      setClickSpeed(diff);

      // Basic consistency logic
      if (clickCount > 0) {
        setConsistency(prev => {
           // dummy logic to simulate varying consistency based on speed difference
           const target = diff < 80 ? 98 : (diff < 150 ? 94 : 85);
           return Math.round((prev + target) / 2);
        });
      }
    }
    setLastClickTime(now);
    setClickCount(c => c + 1);
  };

  const getStatus = () => {
    if (!clickSpeed) return 'Ready';
    if (clickSpeed < 80) return 'Optimal';
    if (clickSpeed < 150) return 'Good';
    return 'Slow';
  };

  return (
    <div className="mt-container fade-in">
      <header className="mt-header">
        <h1 className="mt-title">Mouse Test</h1>
        <p className="mt-subtitle">
          Verify button integrity, scroll precision, and double-click consistency in a high-fidelity environment.
        </p>
      </header>

      <div className="mt-grid">
        {/* Left Column: Mouse Visualizer */}
        <div className="mt-card">
          <div className="mt-card-glow"></div>
          <h2 className="mt-card-title">
            <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>🖱️</span>
            Button Detection
          </h2>

          <div className="mt-mouse-wrapper" onContextMenu={handleContextMenu}>
            <div className="mt-mouse">
              <div className="mt-mouse-row">
                <div className={`mt-mouse-btn mt-mouse-btn-l ${buttons.left ? 'active' : ''}`}>
                  <span className="mt-mouse-btn-label">LMB</span>
                </div>

                <div className={`mt-mouse-mid ${buttons.middle ? 'active' : ''}`}>
                  <div className="mt-mouse-wheel">
                    <div className="mt-mouse-wheel-tick"></div>
                  </div>
                  <span className="mt-mouse-btn-label" style={{ fontSize: '0.6rem' }}>MID</span>
                </div>

                <div className={`mt-mouse-btn mt-mouse-btn-r ${buttons.right ? 'active' : ''}`}>
                  <span className="mt-mouse-btn-label">RMB</span>
                </div>
              </div>

              <div className="mt-mouse-body">
                <div className="mt-mouse-side-btns">
                  <div className={`mt-mouse-side-btn ${buttons.side1 ? 'active' : ''}`}></div>
                  <div className={`mt-mouse-side-btn ${buttons.side2 ? 'active' : ''}`}></div>
                </div>
                <span className="mt-mouse-icon">📡</span>
              </div>
            </div>
          </div>

          <div className="mt-status-chips">
            <div className={`mt-chip ${buttons.left || buttons.right || buttons.middle || buttons.side1 || buttons.side2 ? 'detected' : 'ready'}`}>
              <div className="mt-chip-dot"></div>
              <span>
                {buttons.left ? 'Left Click Detected' :
                 buttons.right ? 'Right Click Detected' :
                 buttons.middle ? 'Middle Click Detected' :
                 buttons.side1 || buttons.side2 ? 'Side Click Detected' : 'Awaiting Input'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Metrics & Double Click */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <div className="mt-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ffb95f' }}>
            <h3 className="mt-card-title tertiary">
               <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>⚡</span>
               Double Click Speed
            </h3>
            <p className="mt-subtitle" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Test your switch debounce and rhythmic precision.
            </p>

            <div
              className="mt-click-area"
              onMouseDown={handleDoubleClickHandler}
              onContextMenu={handleContextMenu}
            >
              <div className="mt-click-area-glow"></div>
              <div className="mt-click-content">
                <span className="mt-click-icon">👆</span>
                <span className="mt-click-text">Click Here Rapidly</span>
                <span className="mt-click-target">Target: &lt; 80ms</span>
              </div>
              {clickSpeed && (
                <div className="mt-click-result">
                  <div className="mt-click-time">{clickSpeed}ms</div>
                  <div className="mt-click-label">Last Speed</div>
                </div>
              )}
            </div>

            <div className="mt-stats-grid">
              <div className="mt-stat-box">
                <div className="mt-stat-label">Consistency</div>
                <div className="mt-stat-value">{clickCount > 1 ? `${consistency}%` : '--'}</div>
              </div>
              <div className="mt-stat-box">
                <div className="mt-stat-label">Status</div>
                <div className={`mt-stat-value ${getStatus() === 'Optimal' ? 'optimal' : ''}`}>
                  {clickCount > 1 ? getStatus() : '--'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-card" style={{ padding: '1.5rem' }}>
            <h3 className="mt-card-title">Advanced Metrics</h3>
            <div className="mt-metrics-list">
              <div className="mt-metric-row">
                <div>
                  <div className="mt-metric-title">Polling Rate</div>
                  <div className="mt-metric-val">{pollingRate > 0 ? pollingRate : '--'} Hz</div>
                </div>
                {pollingRate > 500 && (
                  <div className="mt-metric-status">
                     <span style={{ fontSize: '1.2rem' }}>✓</span> High Performance
                  </div>
                )}
              </div>
              <div className="mt-metric-row">
                <div>
                  <div className="mt-metric-title">Wheel Delta</div>
                  <div className="mt-metric-val">{scrollDelta !== 0 ? (scrollDelta > 0 ? '+' : '') + scrollDelta : '±0'}</div>
                </div>
                <div className="mt-metric-sub">Vertical</div>
              </div>
              <div className="mt-metric-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div>
                  <div className="mt-metric-title">Side Buttons</div>
                  <div className="mt-metric-val" style={{ opacity: buttons.side1 || buttons.side2 ? 1 : 0.3 }}>
                     {buttons.side1 || buttons.side2 ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--border-color)', background: buttons.side1 || buttons.side2 ? 'var(--accent-primary)' : 'transparent' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-scroll-section" onWheel={handleWheel}>
        <div className="mt-scroll-card">
           <div className="mt-scroll-layout">
             <div className="mt-scroll-content">
               <h3 className="mt-scroll-title">Scroll Accuracy</h3>
               <p className="mt-scroll-desc">
                 Test for phantom scrolling or scroll wheel slippage by interacting with the infinite track below.
               </p>
               <div className="mt-scroll-actions">
                  <button className="mt-btn-primary" onClick={() => { setScrollDelta(0); setScrollPosition(50); }}>
                    Reset Logs
                  </button>
               </div>
             </div>

             <div className="mt-scroll-visualizer">
                <div className="mt-scroll-viz-bg"></div>
                <div className="mt-scroll-badge">Real-time Scroll Stream</div>

                <div className="mt-scroll-stream">
                  <div className="mt-scroll-bar-container">
                     <div className="mt-scroll-bar" style={{ transform: `translateY(${(scrollPosition / 100) * 5}rem)` }}></div>
                  </div>
                  <div className="mt-scroll-lines">
                    <div className="mt-scroll-line"><div className="mt-scroll-line-fill c1" style={{ width: scrollDir === 'Down' ? '80%' : '66%' }}></div></div>
                    <div className="mt-scroll-line"><div className="mt-scroll-line-fill c2" style={{ width: scrollDir === 'Up' ? '70%' : '50%' }}></div></div>
                    <div className="mt-scroll-line"><div className="mt-scroll-line-fill c3" style={{ width: scrollDir !== 'None' ? '40%' : '25%' }}></div></div>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </section>

    </div>
  );
};

export default MouseTest;
