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

const KNOWN_CODES: Record<string, string> = {
  'Asia/Kolkata': 'IST',
  'Asia/Calcutta': 'IST',
  'America/Los_Angeles': 'PST/PDT',
  'America/Vancouver': 'PST/PDT',
  'America/Chicago': 'CST/CDT',
  'America/Winnipeg': 'CST/CDT',
  'America/Denver': 'MST/MDT',
  'America/Edmonton': 'MST/MDT',
  'America/New_York': 'EST/EDT',
  'America/Toronto': 'EST/EDT',
  'America/Halifax': 'AST/ADT',
  'America/St_Johns': 'NST/NDT',
  'America/Phoenix': 'MST',
  'Europe/London': 'GMT/BST',
  'Europe/Paris': 'CET/CEST',
  'Europe/Berlin': 'CET/CEST',
  'Asia/Dubai': 'GST',
  'Asia/Tokyo': 'JST',
  'Australia/Sydney': 'AEST/AEDT',
  'Pacific/Auckland': 'NZST/NZDT',
  'Asia/Shanghai': 'CST',
  'Asia/Singapore': 'SGT',
  'Asia/Hong_Kong': 'HKT',
};

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

const CustomSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  style?: React.CSSProperties;
}> = ({ value, onChange, options, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: '1rem'
        }}
      >
        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedOption?.label}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '0.5rem' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="custom-scrollbar"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              marginTop: '0.5rem',
              maxHeight: '250px',
              overflowY: 'auto',
              boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.8)',
              padding: '0.4rem'
            }}
          >
            {options.map(opt => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  borderRadius: '0.5rem',
                  background: value === opt.value ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: value === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                  marginBottom: '0.2rem',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  fontWeight: value === opt.value ? '600' : '400'
                }}
                onMouseEnter={(e) => {
                   if (value !== opt.value) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                   if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TimeInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const [h, m] = value.split(':');
  const hRef = React.useRef<HTMLInputElement>(null);
  const mRef = React.useRef<HTMLInputElement>(null);

  const update = (newH: string, newM: string) => {
    onChange(`${newH.padStart(2, '0')}:${newM.padStart(2, '0')}`);
  };

  const onHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      onChange(`:${m}`);
      return;
    }
    
    let num = parseInt(val);
    if (num > 12) {
      // If they type e.g. "13", keep it as "1" or handle as needed. 
      // For now, let's just take the last digit if it's > 12 or just limit to 12.
      val = val.slice(-1);
      num = parseInt(val);
    }
    
    onChange(`${val}:${m}`);

    // Jump logic: 
    // - If it's 2 digits (e.g. "10", "11", "12", "01")
    // - Or if it's a single digit > 1 (e.g. "2"-"9" since these can't be the start of a 10-12 hour)
    if (val.length === 2 || (num > 1 && num <= 9)) {
      mRef.current?.focus();
      mRef.current?.select();
    }
  };

  const onMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(-2);
    let num = parseInt(val);
    if (!isNaN(num) && num > 59) {
      val = '59';
    }
    onChange(`${h}:${val}`);
  };

  const onKeyDown = (e: React.KeyboardEvent, type: 'h' | 'm') => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.key === 'ArrowUp' ? 1 : -1;
      if (type === 'h') {
        let num = (parseInt(h) || 12) + delta;
        if (num > 12) num = 1;
        if (num < 1) num = 12;
        update(String(num), m);
      } else {
        let num = (parseInt(m) || 0) + delta;
        if (num > 59) num = 0;
        if (num < 0) num = 59;
        update(h, String(num));
      }
    } else if (e.key === 'Backspace' && type === 'm' && m === '') {
      hRef.current?.focus();
    } else if (e.key === ':' && type === 'h') {
      e.preventDefault();
      mRef.current?.focus();
    }
  };

  const onHBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    let nH = parseInt(val);
    if (isNaN(nH) || nH === 0) nH = 12;
    if (nH > 12) nH = 12;
    update(String(nH), m);
    setHFocused(false);
  };

  const onMBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    let nM = parseInt(val);
    if (isNaN(nM)) nM = 0;
    if (nM > 59) nM = 59;
    update(h, String(nM));
    setMFocused(false);
  };

  const subInputStyle: (focused: boolean) => React.CSSProperties = (focused) => ({
    background: focused ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
    border: 'none',
    color: focused ? 'var(--accent-primary)' : 'inherit',
    fontSize: '1.1rem',
    fontWeight: '700',
    textAlign: 'center',
    width: '35px',
    outline: 'none',
    padding: '0.2rem 0',
    borderRadius: '0.3rem',
    letterSpacing: '0.05em',
    transition: 'all 0.2s'
  });

  const [hFocused, setHFocused] = useState(false);
  const [mFocused, setMFocused] = useState(false);

  return (
    <div style={{ 
      ...inputStyle, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '0.4rem', 
      padding: '0 1rem', 
      height: '48px',
      borderColor: (hFocused || mFocused) ? 'var(--accent-primary)' : 'var(--border-color)',
      background: (hFocused || mFocused) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
    }}>
      <input
        ref={hRef}
        type="text"
        value={h}
        maxLength={2}
        onChange={onHChange}
        onKeyDown={(e) => onKeyDown(e, 'h')}
        onFocus={(e) => { e.target.select(); setHFocused(true); }}
        onBlur={onHBlur}
        style={subInputStyle(hFocused)}
        placeholder="12"
      />
      <span style={{ opacity: 0.3, fontWeight: 'bold' }}>:</span>
      <input
        ref={mRef}
        type="text"
        value={m}
        maxLength={2}
        onChange={onMChange}
        onKeyDown={(e) => onKeyDown(e, 'm')}
        onFocus={(e) => { e.target.select(); setMFocused(true); }}
        onBlur={onMBlur}
        style={subInputStyle(mFocused)}
        placeholder="00"
      />
    </div>
  );
};

const CURATED_ZONES = [
  { label: 'UTC — Coordinated Universal Time', value: 'UTC' },
  { label: 'PST — Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
  { label: 'MST — Mountain Time (US & Canada)', value: 'America/Denver' },
  { label: 'CST — Central Time (US & Canada)', value: 'America/Chicago' },
  { label: 'EST — Eastern Time (US & Canada)', value: 'America/New_York' },
  { label: 'GMT — Greenwich Mean Time', value: 'Europe/London' },
  { label: 'CET — Central European Time', value: 'Europe/Berlin' },
  { label: 'JST — Japan Standard Time', value: 'Asia/Tokyo' },
  { label: 'IST — India Standard Time', value: 'Asia/Kolkata' },
  { label: 'AEST — Australian Eastern Time', value: 'Australia/Sydney' },
];

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
  const [sourceTz, setSourceTz] = useStorage<string>('wc-conv-source', 'UTC');
  const [targetTz, setTargetTz] = useStorage<string>('wc-conv-target', localTz);
  const [sourceTime, setSourceTime] = useState(() => {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m}`;
  });
  const [isPm, setIsPm] = useState(() => new Date().getHours() >= 12);

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
      let shortCode = '';
      try {
        const formatter = getFormatter('en-US', {
          timeZone: tz,
          timeZoneName: 'longGeneric'
        });
        const dparts = formatter.formatToParts(new Date());
        region = dparts.find((p: any) => p.type === 'timeZoneName')?.value || '';

        const offsetFormatter = getFormatter('en-US', {
          timeZone: tz,
          timeZoneName: 'shortOffset'
        });
        const oParts = offsetFormatter.formatToParts(new Date());
        utcOffset = (oParts.find((p: any) => p.type === 'timeZoneName')?.value || '').replace('GMT', 'UTC');

        // Try to get shortCode with fallbacks
        if (KNOWN_CODES[tz]) {
          shortCode = KNOWN_CODES[tz];
        } else {
          // Try multiple locales for better code detection
          const locales = ['en-US', 'en-GB', 'en-IN'];
          for (const loc of locales) {
            const codeFormatter = getFormatter(loc, {
              timeZone: tz,
              timeZoneName: 'short'
            });
            const cParts = codeFormatter.formatToParts(new Date());
            const val = cParts.find((p: any) => p.type === 'timeZoneName')?.value || '';
            if (val && !val.includes('GMT') && !val.includes('+') && !val.includes('-')) {
              shortCode = val;
              break;
            }
          }
          // Final fallback
          if (!shortCode) shortCode = utcOffset.replace('UTC', 'GMT');
        }
      } catch (e) { /* fallback */ }

      const associatedCountries = Object.entries(countryMapping)
        .filter(([_, zones]) => zones.includes(tz))
        .map(([country]) => country);

      return {
        id: tz,
        city,
        region,
        utcOffset,
        shortCode,
        countries: associatedCountries,
        displayName: tz.replace(/_/g, ' ')
      };
    });
  }, [allTimezones]);

  const getFilteredTimezones = useCallback((query: string) => {
    const q = (query || '').toLowerCase().trim();
    
    if (!q) {
      // Return all zones if no query, sorted by shortCode and city
      return [...searchRegistry].sort((a, b) => 
        (a.shortCode || a.displayName).localeCompare(b.shortCode || b.displayName)
      );
    }
    
    interface ScoredItem {
      item: typeof searchRegistry[0];
      score: number;
    }

    const scored = searchRegistry.reduce((acc: ScoredItem[], item) => {
      let score = -1;
      if (item.shortCode.toLowerCase() === q) score = 110;
      else if (item.countries.some(c => c === q)) score = 100;
      else if (item.countries.some(c => c.startsWith(q))) score = 80;
      else if (item.city.toLowerCase().startsWith(q)) score = 70;
      else if (item.region.toLowerCase().startsWith(q)) score = 60;
      else if (item.city.toLowerCase().includes(q) || item.countries.some(c => c.includes(q))) score = 40;
      else if (item.id.toLowerCase().includes(q) || item.shortCode.toLowerCase().includes(q)) score = 10;

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
      // Step 1: Parse the 12-hour input and combine with today's date
      const [hStr, mStr] = sourceTime.split(':');
      let hours = parseInt(hStr);
      const minutes = parseInt(mStr);
      
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;

      const sourceDate = new Date();
      sourceDate.setHours(hours, minutes, 0, 0);

      const sourceFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: sourceTz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });

      const parts = sourceFormatter.formatToParts(sourceDate);
      const getPart = (type: string) => parts.find((p: any) => p.type === type)?.value;

      const wallDateSource = new Date(`${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`);
      const offsetMs = wallDateSource.getTime() - sourceDate.getTime();
      const absoluteTime = new Date(sourceDate.getTime() - offsetMs);

      // Step 2: Format in target timezone
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

      let rollover = 'Same Day';
      if (tLocaleDate > sLocaleDate) rollover = 'Next Day';
      else if (tLocaleDate < sLocaleDate) rollover = 'Previous Day';

      return { time12, time24, dateStr, rollover };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [sourceTime, sourceTz, targetTz, isPm]);


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
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Event Time</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <TimeInput value={sourceTime} onChange={setSourceTime} />
                <CustomSelect
                  value={isPm ? 'PM' : 'AM'}
                  onChange={(val) => setIsPm(val === 'PM')}
                  options={[{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }]}
                  style={{ width: '100px' }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: windowWidth < 600 ? 'column' : 'row',
              alignItems: windowWidth < 600 ? 'stretch' : 'flex-end',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>From Timezone</label>
                <CustomSelect
                  value={sourceTz}
                  onChange={setSourceTz}
                  options={CURATED_ZONES}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleSwap}
                  className="swap-tz-button"
                  aria-label="Swap"
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
                  <i className="fas fa-retweet" style={{ fontSize: '1.2rem' }}></i>
                  <span style={{ fontSize: '1.2rem' }}>⇄</span>
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>To Timezone</label>
                <CustomSelect
                  value={targetTz}
                  onChange={setTargetTz}
                  options={CURATED_ZONES}
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
                      background: 'rgba(15, 23, 42, 0.4)',
                      color: 'var(--text-secondary)',
                      padding: '0.2rem 0.75rem',
                      borderRadius: '99px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      border: '1px solid var(--border-color)',
                      letterSpacing: '0.05em'
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
