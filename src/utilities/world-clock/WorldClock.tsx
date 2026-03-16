import React, { useState, useEffect, useMemo } from 'react';
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
  const [watchlist, setWatchlist] = useStorage<string[]>('world-clock-watchlist', DEFAULT_ZONES);
  const [isLive, setIsLive] = useState(true);
  const [customTime, setCustomTime] = useState<string>(''); // For manual input (YYYY-MM-DDTHH:mm)
  const [now, setNow] = useState(new Date());

  // Search state
  const [search, setSearch] = useState('');
  const allTimezones = useMemo(() => {
    try {
      return (Intl as any).supportedValuesOf('timeZone') as string[];
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

  const filteredTimezones = useMemo(() => {
    if (!search || search.length < 1) return [];
    const query = search.toLowerCase();
    
    interface ScoredItem {
      item: typeof searchRegistry[0];
      score: number;
    }

    const scored = searchRegistry.reduce((acc: ScoredItem[], item) => {
      let score = -1;
      if (item.countries.some(c => c === query)) score = 100;
      else if (item.countries.some(c => c.startsWith(query))) score = 80;
      else if (item.city.toLowerCase().startsWith(query)) score = 70;
      else if (item.region.toLowerCase().startsWith(query)) score = 60;
      else if (item.city.toLowerCase().includes(query) || item.countries.some(c => c.includes(query))) score = 40;
      else if (item.id.toLowerCase().includes(query)) score = 10;

      if (score > 0) acc.push({ item, score });
      return acc;
    }, []);

    return scored
      .sort((a, b) => b.score - a.score || a.item.city.localeCompare(b.item.city))
      .slice(0, 40)
      .map(s => s.item);
  }, [search, searchRegistry]);

  const toggleLive = () => {
    if (isLive) {
      const localISO = new Date(displayTime.getTime() - (displayTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setCustomTime(localISO);
    }
    setIsLive(!isLive);
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

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>🌍</div>
          <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>World Clock</h2>
        </div>
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
      </div>

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
