import React, { useState, useEffect, useMemo } from 'react';
import { useStorage } from '../../hooks/useStorage';

const DEFAULT_ZONES = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Asia/Dubai'
];

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
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: tz
    }).format(date);
  };

  const formatDate = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: tz
    }).format(date);
  };

  const getDayNightStatus = (date: Date, tz: string) => {
    const hour = parseInt(new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: tz
    }).format(date));
    return hour >= 6 && hour < 18 ? 'day' : 'night';
  };

  const getTimeOffset = (date: Date, tz: string) => {
    // Simplistic offset display
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

  // Enhanced search logic: map each TZ to a searchable string containing ID and Long Generic Name
  const searchRegistry = useMemo(() => {
    // Map of common keywords to specific TZ IDs to ensure country-based searches work
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
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'longGeneric'
        });
        const dparts = formatter.formatToParts(now);
        region = dparts.find(p => p.type === 'timeZoneName')?.value || '';

        const offsetFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'shortOffset'
        });
        const oParts = offsetFormatter.formatToParts(now);
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
        // The display name we show in results
        displayName: tz.replace(/_/g, ' ')
      };
    });
  }, [allTimezones, now]);

  const filteredTimezones = useMemo(() => {
    if (!search || search.length < 1) return [];
    const query = search.toLowerCase();
    
    interface ScoredItem {
      item: typeof searchRegistry[0];
      score: number;
    }

    const scored = searchRegistry.reduce((acc: ScoredItem[], item) => {
      let score = -1;

      // 1. Exact country match (Highest priority)
      if (item.countries.some(c => c === query)) {
        score = 100;
      }
      // 2. Country starts with query
      else if (item.countries.some(c => c.startsWith(query))) {
        score = 80;
      }
      // 3. City name starts with query
      else if (item.city.toLowerCase().startsWith(query)) {
        score = 70;
      }
      // 4. Region name starts with query
      else if (item.region.toLowerCase().startsWith(query)) {
        score = 60;
      }
      // 5. Query is inside city or country name
      else if (item.city.toLowerCase().includes(query) || item.countries.some(c => c.includes(query))) {
        score = 40;
      }
      // 6. Query is inside the full TZ ID (Lowest priority, handles the "Indian/" noise)
      else if (item.id.toLowerCase().includes(query)) {
        score = 10;
      }

      if (score > 0) {
        acc.push({ item, score });
      }
      return acc;
    }, []);

    return scored
      .sort((a, b) => b.score - a.score || a.item.city.localeCompare(b.item.city))
      .slice(0, 40)
      .map(s => s.item);
  }, [search, searchRegistry]);

  const toggleLive = () => {
    if (isLive) {
      // Pause: Set customTime to current input/display
      const localISO = new Date(displayTime.getTime() - (displayTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setCustomTime(localISO);
    }
    setIsLive(!isLive);
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="gradient-text" style={{ margin: 0 }}>World Clock</h2>
        <button 
          onClick={toggleLive}
          style={{ 
            background: isLive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 146, 60, 0.1)',
            color: isLive ? '#4ade80' : '#fb923c',
            border: `1px solid ${isLive ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 146, 60, 0.2)'}`,
            padding: '0.4rem 0.8rem',
            fontSize: '0.85rem'
          }}
        >
          {isLive ? '● Live' : '⏸ Paused'}
        </button>
      </div>

      {!isLive && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Set Reference Time (Local)
          </label>
          <input 
            type="datetime-local" 
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            style={{ width: '100%', fontSize: '1.1rem' }}
          />
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Search city or country..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%' }}
        />
        {filteredTimezones.length > 0 && (
          <div 
            className="custom-scrollbar"
            style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              zIndex: 10, 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              marginTop: '0.25rem',
              maxHeight: '320px',
              overflowY: 'auto',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {filteredTimezones.map(item => (
              <div 
                key={item.id} 
                onClick={() => handleAddZone(item.id)}
                style={{ 
                  padding: '0.75rem 1rem', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '0.9rem' }}>{item.displayName}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600' }}>{item.region}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.utcOffset}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Local Time First */}
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
  const tzShort = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    }).format(date).split(' ').pop()?.replace('GMT', 'UTC');
  }, [date, tz]);
  
  return (
    <div style={{ 
      background: 'var(--bg-secondary)', 
      borderRadius: '0.75rem', 
      padding: '1.25rem', 
      border: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glow effect */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '4px', 
        height: '100%', 
        background: isDay ? 'var(--accent-primary)' : '#818cf8',
        boxShadow: `0 0 15px ${isDay ? 'var(--accent-primary)' : '#818cf8'}`
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            {label} {isLocal && '• Current'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {formatTime(date, tz)}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
              {tzShort}
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {tz.replace(/_/g, ' ')} • {formatDate(date, tz)}
          </div>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          {!isLocal && (
            <button 
              onClick={onRemove}
              style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-secondary)', fontSize: '1.1rem' }}
            >
              ×
            </button>
          )}
          <div style={{ fontSize: '1.5rem' }}>
            {isDay ? '☀️' : '🌙'}
          </div>
          <div style={{ fontSize: '0.75rem', color: isDay ? 'var(--accent-primary)' : '#818cf8', fontWeight: '600' }}>
            {!isLocal && getTimeOffset(date, tz)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldClock;
