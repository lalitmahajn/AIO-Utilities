import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStorage } from '../../hooks/useStorage';
import '../../styles/global.css';

const DEFAULT_ZONES = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Asia/Dubai'
];

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const cacheKey = `${locale}-${JSON.stringify(options)}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
};

const WorldClock: React.FC = () => {
  const localTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [mode, setMode] = useStorage<'clock' | 'converter'>('world-clock-mode', 'clock');
  const [watchlist, setWatchlist] = useStorage<string[]>('world-clock-watchlist', DEFAULT_ZONES);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isLive, setIsLive] = useState(true);
  const [customTime, setCustomTime] = useState<string>(''); // For manual input (YYYY-MM-DDTHH:mm)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Converter State
  const [sourceTz, setSourceTz] = useStorage<string>('wc-conv-source', localTz);
  const [targetTz, setTargetTz] = useStorage<string>('wc-conv-target', 'UTC');
  const [sourceTime, setSourceTime] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  });

  // Search state
  const [search, setSearch] = useState('');
  const allTimezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (e) {
      return ['UTC'];
    }
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const displayTime = useMemo(() => {
    if (isLive) return now;
    if (customTime) return new Date(customTime);
    return now;
  }, [isLive, now, customTime]);

  const formatTime = (date: Date, tz: string) => {
    return getFormatter('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: tz
    }).format(date);
  };

  const formatDate = (date: Date, tz: string) => {
    return getFormatter('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: tz
    }).format(date);
  };

  const getDayNightStatus = (date: Date, tz: string) => {
    const hour = parseInt(getFormatter('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: tz
    }).format(date));
    return hour >= 6 && hour < 18 ? 'day' : 'night';
  };

  const getTimeOffset = (date: Date, tz: string) => {
    const targetTime = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    const localTime = new Date(date.toLocaleString('en-US', { timeZone: localTz }));
    const diffHours = (targetTime.getTime() - localTime.getTime()) / (1000 * 60 * 60);
    
    if (diffHours === 0) return 'Same as local';
    return `${diffHours > 0 ? '+' : ''}${diffHours.toFixed(1).replace('.0', '')}h from local`;
  };

  const handleAddZone = (tz: string) => {
    if (!watchlist.includes(tz)) {
      setWatchlist([...watchlist, tz]);
    }
    setSearch('');
  };

  const handleRemoveZone = (tz: string) => {
    setWatchlist(watchlist.filter(z => z !== tz));
  };

  const searchRegistry = useMemo(() => {
    const countryMapping: Record<string, string[]> = {
      'india': ['Asia/Kolkata'],
      'usa': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
      'united states': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
      'uk': ['Europe/London'],
      'united kingdom': ['Europe/London'],
      'russia': ['Europe/Moscow', 'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Vladivostok'],
      'china': ['Asia/Shanghai'],
      'australia': ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Adelaide', 'Australia/Brisbane'],
      'canada': ['America/Toronto', 'America/Vancouver', 'America/Winnipeg', 'America/Edmonton', 'America/Halifax'],
      'brazil': ['America/Sao_Paulo'],
      'germany': ['Europe/Berlin'],
      'france': ['Europe/Paris'],
      'japan': ['Asia/Tokyo'],
      'uae': ['Asia/Dubai'],
      'united arab emirates': ['Asia/Dubai'],
    };

    return allTimezones.map(tz => {
      const parts = tz.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      let region = '';
      let utcOffset = '';
      try {
        const formatter = getFormatter('en-US', {
          timeZone: tz,
          timeZoneName: 'longGeneric'
        });
        const dparts = formatter.formatToParts(new Date());
        region = dparts.find(p => p.type === 'timeZoneName')?.value || '';

        const offsetFormatter = getFormatter('en-US', {
          timeZone: tz,
          timeZoneName: 'shortOffset'
        });
        const oParts = offsetFormatter.formatToParts(new Date());
        utcOffset = (oParts.find(p => p.type === 'timeZoneName')?.value || '').replace('GMT', 'UTC');
      } catch (e) { /* fallback */ }

      const associatedCountries = Object.entries(countryMapping)
        .filter(([_, zones]) => zones.includes(tz))
        .map(([country]) => country);

      return {
        id: tz,
        city,
        region,
        utcOffset,
        countries: associatedCountries,
        displayName: tz.replace(/_/g, ' ')
      };
    });
  }, [allTimezones]);

  const getFilteredTimezones = useCallback((query: string) => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    
    interface ScoredItem {
      item: typeof searchRegistry[0];
      score: number;
    }

    const scored = searchRegistry.reduce((acc: ScoredItem[], item) => {
      let score = -1;
      if (item.countries.some(c => c === q)) score = 100;
      else if (item.countries.some(c => c.startsWith(q))) score = 80;
      else if (item.city.toLowerCase().startsWith(q)) score = 70;
      else if (item.region.toLowerCase().startsWith(q)) score = 60;
      else if (item.city.toLowerCase().includes(q) || item.countries.some(c => c.includes(q))) score = 40;
      else if (item.id.toLowerCase().includes(q)) score = 10;

      if (score > 0) acc.push({ item, score });
      return acc;
    }, []);

    return scored
      .sort((a, b) => b.score - a.score || a.item.city.localeCompare(b.item.city))
      .slice(0, 40)
      .map(s => s.item);
  }, [searchRegistry]);

  const filteredTimezones = useMemo(() => getFilteredTimezones(search), [search, getFilteredTimezones]);

  const toggleLive = () => {
    if (isLive) {
      const localISO = new Date(displayTime.getTime() - (displayTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setCustomTime(localISO);
    }
    setIsLive(!isLive);
  };

  const handleSwap = () => {
    const temp = sourceTz;
    setSourceTz(targetTz);
    setTargetTz(temp);
  };

  const convertedResult = useMemo(() => {
    if (!sourceTime || !sourceTz || !targetTz) return null;

    try {
      // Create a date object representing the source time in the source timezone
      // Since datetime-local gives us a string that's "naive" (no timezone),
      // we need to correctly interpret it as being in sourceTz.

      // Step 1: Get the current offset for the source timezone
      const sourceDate = new Date(sourceTime);
      const sourceFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: sourceTz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });

      const parts = sourceFormatter.formatToParts(sourceDate);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value;

      // Construct a Date that represents the "wall time" in sourceTz
      const wallDateSource = new Date(`${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`);

      // Calculate the difference between the absolute time and the wall time in sourceTz
      const offsetMs = wallDateSource.getTime() - sourceDate.getTime();

      // Adjust the sourceTime (absolute) to correctly represent the input wall time in sourceTz
      const absoluteTime = new Date(sourceDate.getTime() - offsetMs);

      // Step 2: Format this absolute time in the target timezone
      const targetFormatterTime = getFormatter('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: targetTz
      });
      const targetFormatterTime24 = getFormatter('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: targetTz
      });
      const targetFormatterDate = getFormatter('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: targetTz
      });

      const time12 = targetFormatterTime.format(absoluteTime);
      const time24 = targetFormatterTime24.format(absoluteTime);
      const dateStr = targetFormatterDate.format(absoluteTime);

      // Determine day rollover
      const sLocaleDate = new Date(absoluteTime.toLocaleString('en-US', { timeZone: sourceTz })).setHours(0,0,0,0);
      const tLocaleDate = new Date(absoluteTime.toLocaleString('en-US', { timeZone: targetTz })).setHours(0,0,0,0);

      let rollover = '';
      if (tLocaleDate > sLocaleDate) rollover = 'Next Day';
      else if (tLocaleDate < sLocaleDate) rollover = 'Previous Day';

      return { time12, time24, dateStr, rollover };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [sourceTime, sourceTz, targetTz]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.6rem',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>🌍</div>
          <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>World Clock</h2>
        </div>
        {mode === 'clock' && (
          <button
            onClick={toggleLive}
            style={{
              background: isLive ? 'rgba(74, 222, 128, 0.08)' : 'rgba(251, 146, 60, 0.08)',
              color: isLive ? '#4ade80' : '#fb923c',
              border: `1px solid ${isLive ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 146, 60, 0.2)'}`,
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ width: '8px', height: '8px', background: isLive ? '#4ade80' : '#fb923c', borderRadius: '50%', boxShadow: `0 0 10px ${isLive ? '#4ade80' : '#fb923c'}` }} />
            {isLive ? 'Live' : 'Paused'}
          </button>
        )}
      </div>

      {/* Mode Switcher */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        padding: '0.3rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '0.8rem',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setMode('clock')}
          style={{
            background: mode === 'clock' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
            color: mode === 'clock' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          World Clock
        </button>
        <button
          onClick={() => setMode('converter')}
          style={{
            background: mode === 'converter' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
            color: mode === 'converter' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          Time Converter
        </button>
      </div>

      {mode === 'clock' && (
        <>
          {!isLive && (
            <div className="fade-in" style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: '500' }}>
                Set Reference Time (Local)
              </label>
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: '500' }}
              />
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              <input
                type="text"
                placeholder="Search city or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.75rem' }}
              />
            </div>
            {filteredTimezones.length > 0 && (
              <div 
                className="custom-scrollbar"
                style={{ 
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.75rem',
                  marginTop: '0.5rem',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {filteredTimezones.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleAddZone(item.id)}
                    style={{
                      padding: '1rem 1.25rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>{item.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>{item.region}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{item.utcOffset}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <ClockCard
              tz={localTz}
              label="Your Location"
              date={displayTime}
              isLocal
              onRemove={() => {}}
              formatTime={formatTime}
              formatDate={formatDate}
              getDayNightStatus={getDayNightStatus}
              getTimeOffset={getTimeOffset}
            />

            {watchlist.filter(tz => tz !== localTz).map(tz => (
              <ClockCard
                key={tz}
                tz={tz}
                label={tz.split('/').pop()?.replace(/_/g, ' ') || tz}
                date={displayTime}
                onRemove={() => handleRemoveZone(tz)}
                formatTime={formatTime}
                formatDate={formatDate}
                getDayNightStatus={getDayNightStatus}
                getTimeOffset={getTimeOffset}
              />
            ))}
          </div>
        </>
      )}

      {mode === 'converter' && (
        <div className="fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Source Time</label>
              <input
                type="datetime-local"
                value={sourceTime}
                onChange={(e) => setSourceTime(e.target.value)}
                style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: '500' }}
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: windowWidth < 600 ? 'column' : 'row',
              alignItems: windowWidth < 600 ? 'stretch' : 'flex-end',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>From Timezone</label>
                <TimezoneSearch
                  value={sourceTz}
                  onChange={setSourceTz}
                  getFilteredTimezones={getFilteredTimezones}
                  inputStyle={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleSwap}
                  className="swap-tz-button"
                  aria-label="Swap timezones"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    marginBottom: windowWidth < 600 ? '0' : '2px',
                    color: 'var(--text-secondary)',
                    transform: windowWidth < 600 ? 'rotate(90deg)' : 'none'
                  }}
                >
                  <i className="fas fa-retweet" style={{ fontSize: '1.1rem' }}></i>
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>To Timezone</label>
                <TimezoneSearch
                  value={targetTz}
                  onChange={setTargetTz}
                  getFilteredTimezones={getFilteredTimezones}
                  inputStyle={inputStyle}
                />
              </div>
            </div>

            {convertedResult && (
              <div className="fade-in" style={{
                marginTop: '1rem',
                padding: windowWidth < 600 ? '1.5rem 1rem' : '2rem',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02))',
                borderRadius: '1.25rem',
                textAlign: 'center',
                border: '1px solid var(--glass-border)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Converted Time
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    fontSize: windowWidth < 600 ? '2.5rem' : '3.5rem',
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                    lineHeight: 1
                  }}>
                    {convertedResult.time12.split(' ')[0]}
                    <span style={{ fontSize: windowWidth < 600 ? '1.2rem' : '1.5rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontWeight: '600' }}>
                      {convertedResult.time12.split(' ')[1]}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {convertedResult.time24} (24-hour)
                  </div>
                </div>

                <div style={{
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {convertedResult.dateStr}
                  </div>
                  {convertedResult.rollover && (
                    <span style={{
                      fontSize: '0.75rem',
                      background: convertedResult.rollover.includes('Next') ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: convertedResult.rollover.includes('Next') ? '#4ade80' : '#ef4444',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '99px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {convertedResult.rollover}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface TimezoneSearchProps {
  value: string;
  onChange: (tz: string) => void;
  getFilteredTimezones: (query: string) => any[];
  inputStyle: React.CSSProperties;
}

const TimezoneSearch: React.FC<TimezoneSearchProps> = ({ value, onChange, getFilteredTimezones, inputStyle }) => {
  const [query, setQuery] = useState(value.replace(/_/g, ' '));
  const [isOpen, setIsOpen] = useState(false);
  const results = useMemo(() => getFilteredTimezones(query === value.replace(/_/g, ' ') ? '' : query), [query, value, getFilteredTimezones]);

  useEffect(() => {
    setQuery(value.replace(/_/g, ' '));
  }, [value]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        style={inputStyle}
        placeholder="Search timezone..."
      />
      {isOpen && results.length > 0 && (
        <div
          className="custom-scrollbar"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            marginTop: '0.5rem',
            maxHeight: '250px',
            overflowY: 'auto',
            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {results.map(item => (
            <div
              key={item.id}
              onClick={() => {
                onChange(item.id);
                setQuery(item.displayName);
                setIsOpen(false);
              }}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>{item.displayName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.utcOffset}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

interface ClockCardProps {
  tz: string;
  label: string;
  date: Date;
  isLocal?: boolean;
  onRemove: () => void;
  formatTime: (d: Date, t: string) => string;
  formatDate: (d: Date, t: string) => string;
  getDayNightStatus: (d: Date, t: string) => string;
  getTimeOffset: (d: Date, t: string) => string;
}

const ClockCard: React.FC<ClockCardProps> = ({ 
  tz, label, date, isLocal, onRemove, 
  formatTime, formatDate, getDayNightStatus, getTimeOffset 
}) => {
  const isDay = getDayNightStatus(date, tz) === 'day';
  const accentColor = isDay ? '#fbbf24' : '#818cf8';
  
  const tzShort = useMemo(() => {
    try {
      return getFormatter('en-US', {
        timeZone: tz,
        timeZoneName: 'short'
      }).format(date).split(' ').pop()?.replace('GMT', 'GMT');
    } catch (e) { return 'GMT'; }
  }, [date, tz]);
  
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      borderRadius: '1.25rem', 
      padding: '1.5rem', 
      border: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s',
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '4px', 
        height: '100%', 
        background: accentColor,
        boxShadow: `0 0 15px ${accentColor}`
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>
              {label}
            </span>
            {isLocal && (
              <span style={{ fontSize: '0.65rem', background: 'var(--accent-primary)', color: 'var(--bg-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                LOCAL
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {formatTime(date, tz).split(' ')[0]}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)', opacity: 0.6 }}>
              {formatTime(date, tz).split(' ')[1]}
            </div>
          </div>
          
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500', marginTop: '0.25rem' }}>
            {formatDate(date, tz)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', opacity: 0.8 }}>
            {tz.replace(/_/g, ' ')} • {tzShort}
          </div>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
          {!isLocal && (
            <button 
              onClick={onRemove}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer', padding: 0 }}
            >
              ×
            </button>
          )}
          <div style={{ 
            fontSize: '1.75rem', 
            width: '48px', 
            height: '48px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: `${accentColor}10`,
            borderRadius: '1rem',
            border: `1px solid ${accentColor}20`
          }}>
            {isDay ? '☀️' : '🌙'}
          </div>
          {!isLocal && (
            <div style={{ fontSize: '0.75rem', color: accentColor, fontWeight: '700', letterSpacing: '0.02em' }}>
              {getTimeOffset(date, tz)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorldClock;
