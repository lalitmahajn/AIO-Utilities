import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStorage } from '../../hooks/useStorage';
import '../../styles/global.css';

type CalcMode = 'birthday' | 'gap';

interface CustomDateInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({ label, value, onChange }) => {
  const parseInit = (val: string) => {
    if (!val) return { d: '', m: '', y: '' };
    const parts = val.includes('-') ? val.split('-') : [];
    if (parts.length === 3) {
      if (parts[0].length === 4) return { d: parts[2], m: parts[1], y: parts[0] };
      return { d: parts[0], m: parts[1], y: parts[2] };
    }
    return { d: '', m: '', y: '' };
  };

  const [parts, setParts] = useState(parseInit(value));

  // Sync internal state when value prop changes externally (e.g., mode switch, storage load)
  useEffect(() => {
    setParts(parseInit(value));
  }, [value]);

  const update = (newParts: { d: string; m: string; y: string }) => {
    setParts(newParts);
    if (newParts.d && newParts.m && newParts.y) {
      onChange(`${newParts.d}-${newParts.m}-${newParts.y}`);
    } else {
      onChange('');
    }
  };

  const handleChange = (field: 'd' | 'm' | 'y', val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, field === 'y' ? 4 : 2);
    if (clean !== '') {
      const num = parseInt(clean);
      if (field === 'd' && num > 31) clean = '31';
      if (field === 'm' && num > 12) clean = '12';
    }
    const nextParts = { ...parts, [field]: clean };
    update(nextParts);

    if (field === 'd' && (clean.length === 2 || (clean.length === 1 && parseInt(clean) > 3))) {
      document.getElementById(`${label}-m`)?.focus();
    }
    if (field === 'm' && (clean.length === 2 || (clean.length === 1 && parseInt(clean) > 1))) {
      document.getElementById(`${label}-y`)?.focus();
    }
  };

  const handleKeyDown = (field: 'd' | 'm' | 'y', e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !e.currentTarget.value) {
      if (field === 'm') document.getElementById(`${label}-d`)?.focus();
      if (field === 'y') document.getElementById(`${label}-m`)?.focus();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
        {label}
      </label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        borderRadius: '0.75rem',
        padding: '0.25rem 0.75rem',
        transition: 'all 0.2s ease',
      }}
      className="input-focus-ring"
      >
        <span style={{ fontSize: '1.2rem', marginRight: '0.75rem', opacity: 0.7 }}>📅</span>
        <input
          id={`${label}-d`}
          type="number"
          placeholder="DD"
          value={parts.d}
          onChange={(e) => handleChange('d', e.target.value)}
          onKeyDown={(e) => handleKeyDown('d', e)}
          className="no-spinner"
          style={{ width: '2.5rem', background: 'transparent', border: 'none', padding: '0.6rem 0', textAlign: 'center', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '500' }}
        />
        <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>/</span>
        <input
          id={`${label}-m`}
          type="number"
          placeholder="MM"
          value={parts.m}
          onChange={(e) => handleChange('m', e.target.value)}
          onKeyDown={(e) => handleKeyDown('m', e)}
          className="no-spinner"
          style={{ width: '2.5rem', background: 'transparent', border: 'none', padding: '0.6rem 0', textAlign: 'center', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '500' }}
        />
        <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>/</span>
        <input
          id={`${label}-y`}
          type="number"
          placeholder="YYYY"
          value={parts.y}
          onChange={(e) => handleChange('y', e.target.value)}
          onKeyDown={(e) => handleKeyDown('y', e)}
          className="no-spinner"
          style={{ width: '4.5rem', background: 'transparent', border: 'none', padding: '0.6rem 0', textAlign: 'center', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '500' }}
        />
      </div>
    </div>
  );
};

const AgeCalculator: React.FC = () => {
  const [mode, setMode] = useStorage<CalcMode>('age-calc-mode', 'birthday');
  const [date1, setDate1] = useStorage<string>('age-calc-date1', '');
  const [date2, setDate2] = useStorage<string>('age-calc-date2', '');

  const parseDate = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[-/.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      if (year < 100) year += (year < 50) ? 2000 : 1900;
      // Reject invalid values (day 0, month -1, etc.)
      if (day < 1 || month < 0 || month > 11 || year < 1) return null;
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) return date;
    }
    return null;
  }, []);

  const { age, nextBirthday, stats } = useMemo(() => {
    const d1 = parseDate(date1);
    const d2_raw = new Date();
    const d2 = mode === 'birthday' ? d2_raw : parseDate(date2);

    if (!d1 || !d2) return { age: null, nextBirthday: null, stats: null };
    if (mode === 'birthday' && d1 > d2_raw) return { age: null, nextBirthday: null, stats: null };

    const [start, end] = d1 < d2 ? [d1, d2] : [d2, d1];
    
    // Exact Age
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
      years--;
      months += 12;
    }
    if (days < 0) {
      const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += lastMonth.getDate();
      months--;
    }

    // Next Birthday
    let birthdayCountdown = null;
    if (mode === 'birthday') {
      const next = new Date(d2_raw.getFullYear(), start.getMonth(), start.getDate());
      if (next < d2_raw) next.setFullYear(d2_raw.getFullYear() + 1);
      
      let nM = next.getMonth() - d2_raw.getMonth();
      let nD = next.getDate() - d2_raw.getDate();
      
      if (nD < 0) {
        const prevMonth = new Date(next.getFullYear(), next.getMonth(), 0);
        nD += prevMonth.getDate();
        nM--;
      }
      if (nM < 0) nM += 12;
      birthdayCountdown = { months: nM, days: nD, date: next };
    }

    // Stats
    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalMonths = (years * 12) + months;
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;

    return { 
      age: { years, months, days }, 
      nextBirthday: birthdayCountdown,
      stats: { totalMonths, totalWeeks, totalDays, totalHours, totalMinutes }
    };
  }, [date1, date2, mode, parseDate]);

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem' }}>🎂</div>
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>Age Calculator</h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setMode('birthday')}
          style={{
            flex: 1,
            background: mode === 'birthday' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'birthday' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            border: 'none',
            padding: '0.6rem',
            borderRadius: '0.7rem',
            fontWeight: '600',
            fontSize: '0.85rem',
            transition: 'all 0.2s',
          }}
        >
          Birthday Mode
        </button>
        <button
          onClick={() => setMode('gap')}
          style={{
            flex: 1,
            background: mode === 'gap' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'gap' ? 'var(--bg-primary)' : 'var(--text-secondary)',
            border: 'none',
            padding: '0.6rem',
            borderRadius: '0.7rem',
            fontWeight: '600',
            fontSize: '0.85rem',
            transition: 'all 0.2s',
          }}
        >
          Age Gap Mode
        </button>
      </div>

      <div className={mode === 'gap' ? 'responsive-grid-2' : ''} style={{ display: mode === 'gap' ? undefined : 'grid', gridTemplateColumns: mode === 'gap' ? undefined : '1fr', gap: mode === 'gap' ? undefined : '1.5rem', marginBottom: '2.5rem' }}>
        <CustomDateInput
          label={mode === 'birthday' ? 'Date of Birth' : 'Person 1 Birthday'}
          value={date1}
          onChange={setDate1}
        />
        {mode === 'gap' && (
          <CustomDateInput
            label="Person 2 Birthday"
            value={date2}
            onChange={setDate2}
          />
        )}
      </div>

      {age && (
        <div className="fade-in">
          {/* Main Result */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02))',
            borderRadius: '1.25rem',
            padding: '2rem',
            border: '1px solid rgba(56,189,248,0.2)',
            textAlign: 'center',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{ 
               position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.05, pointerEvents: 'none' 
             }}>{mode === 'birthday' ? '🎉' : '📐'}</div>
             
             <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold', marginBottom: '1.5rem' }}>
               {mode === 'birthday' ? 'Current Age' : 'Age Gap'}
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
               <div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{age.years}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: '500' }}>YEARS</div>
               </div>
               <div style={{ width: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
               <div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{age.months}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: '500' }}>MONTHS</div>
               </div>
               <div style={{ width: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
               <div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{age.days}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: '500' }}>DAYS</div>
               </div>
             </div>
          </div>

          {/* Next Birthday */}
          {nextBirthday && (
            <div style={{ 
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid var(--border-color)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.25rem' }}>Next Birthday</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                  {nextBirthday.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                  {nextBirthday.months}m {nextBirthday.days}d
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Remaining time</div>
              </div>
            </div>
          )}

          {/* Life Highlights */}
          {stats && (
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '4px', height: '1.2rem', background: 'var(--accent-primary)', borderRadius: '2px' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{mode === 'birthday' ? 'Life in Numbers' : 'Gap Breakdown'}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {(mode === 'birthday' ? [
                  { label: 'Total Months', value: stats.totalMonths, icon: '📅' },
                  { label: 'Total Weeks', value: stats.totalWeeks, icon: '🗓️' },
                  { label: 'Total Days', value: stats.totalDays, icon: '☀️' },
                  { label: 'Total Hours', value: stats.totalHours, icon: '🕒' },
                  { label: 'Total Minutes', value: stats.totalMinutes, icon: '⌛' }
                ] : [
                  { label: 'Elapsed Months', value: stats.totalMonths, icon: '📅' },
                  { label: 'Elapsed Weeks', value: stats.totalWeeks, icon: '🗓️' },
                  { label: 'Elapsed Days', value: stats.totalDays, icon: '☀️' },
                  { label: 'Elapsed Hours', value: stats.totalHours, icon: '🕒' },
                  { label: 'Elapsed Minutes', value: stats.totalMinutes, icon: '⌛' }
                ]).map((stat, i) => (
                  <div key={i} style={{ 
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1rem',
                    borderRadius: '0.85rem',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}
                  className="hover-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1rem', opacity: 0.6 }}>{stat.icon}</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {stat.value.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!age && (date1 || date2) && (
        <div style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          padding: '1.5rem', 
          background: 'rgba(239, 68, 68, 0.05)', 
          borderRadius: '1rem',
          border: '1px solid rgba(239, 68, 68, 0.1)',
          color: '#f87171',
          fontSize: '0.9rem'
        }}>
          {mode === 'birthday' && parseDate(date1) && parseDate(date1)! > new Date() 
            ? 'Wait, are you from the future? Please enter a valid date.' 
            : mode === 'gap' && date1 && !date2
            ? 'Please enter Person 2\'s Birthday to calculate the gap.'
            : mode === 'gap' && !date1 && date2
            ? 'Please enter Person 1\'s Birthday to calculate the gap.'
            : 'Please enter a complete and valid date.'}
        </div>
      )}
    </div>
  );
};

export default AgeCalculator;
