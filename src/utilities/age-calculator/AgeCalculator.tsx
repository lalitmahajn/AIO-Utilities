import React, { useState, useEffect } from 'react';
import { useStorage } from '../../hooks/useStorage';
import '../../styles/global.css';

type CalcMode = 'birthday' | 'gap';

interface CustomDateInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({ label, value, onChange }) => {
  // Parse existing dd-mm-yy or yyyy-mm-dd
  const parseInit = (val: string) => {
    if (!val) return { d: '', m: '', y: '' };
    const parts = val.includes('-') ? val.split('-') : [];
    if (parts.length === 3) {
      if (parts[0].length === 4) return { d: parts[2], m: parts[1], y: parts[0] }; // yyyy-mm-dd
      return { d: parts[0], m: parts[1], y: parts[2] }; // dd-mm-yy
    }
    return { d: '', m: '', y: '' };
  };

  const [parts, setParts] = useState(parseInit(value));

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

    // Auto-focus logic
    // Jump if 2 digits are entered OR if 1st digit already makes it a full value (e.g. typing '4' for day)
    if (field === 'd') {
      if (clean.length === 2 || (clean.length === 1 && parseInt(clean) > 3)) {
        document.getElementById(`${label}-m`)?.focus();
      }
    }
    if (field === 'm') {
      if (clean.length === 2 || (clean.length === 1 && parseInt(clean) > 1)) {
        document.getElementById(`${label}-y`)?.focus();
      }
    }
  };

  const handleKeyDown = (field: 'd' | 'm' | 'y', e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !(e.currentTarget.value)) {
      if (field === 'm') document.getElementById(`${label}-d`)?.focus();
      if (field === 'y') document.getElementById(`${label}-m`)?.focus();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {label}
      </label>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)',
        borderRadius: '0.375rem',
        padding: '0 0.75rem',
        transition: 'var(--transition)',
      }}>
        <span style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', marginRight: '0.75rem' }}>📅</span>
        <input
          id={`${label}-d`}
          type="number"
          placeholder="dd"
          value={parts.d}
          onChange={(e) => handleChange('d', e.target.value)}
          onKeyDown={(e) => handleKeyDown('d', e)}
          className="no-spinner"
          style={{ width: '2.5rem', background: 'transparent', border: 'none', padding: '0.5rem 0', textAlign: 'center' }}
        />
        <span style={{ color: 'var(--text-secondary)' }}>-</span>
        <input
          id={`${label}-m`}
          type="number"
          placeholder="mm"
          value={parts.m}
          onChange={(e) => handleChange('m', e.target.value)}
          onKeyDown={(e) => handleKeyDown('m', e)}
          className="no-spinner"
          style={{ width: '2.5rem', background: 'transparent', border: 'none', padding: '0.5rem 0', textAlign: 'center' }}
        />
        <span style={{ color: 'var(--text-secondary)' }}>-</span>
        <input
          id={`${label}-y`}
          type="number"
          placeholder="yyyy"
          value={parts.y}
          onChange={(e) => handleChange('y', e.target.value)}
          onKeyDown={(e) => handleKeyDown('y', e)}
          className="no-spinner"
          style={{ width: '4rem', background: 'transparent', border: 'none', padding: '0.5rem 0', textAlign: 'center' }}
        />
      </div>
    </div>
  );
};

const AgeCalculator: React.FC = () => {
  const [mode, setMode] = useStorage<CalcMode>('age-calc-mode', 'birthday');
  const [date1, setDate1] = useStorage<string>('age-calc-date1', '');
  const [date2, setDate2] = useStorage<string>('age-calc-date2', ''); // Used for comparison in 'gap' mode
  const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);
  const [nextBirthday, setNextBirthday] = useState<{ months: number; days: number } | null>(null);

  useEffect(() => {
    if (mode === 'birthday') {
      if (date1) calculateDiff(date1, new Date().toISOString().split('T')[0]);
      else {
        setAge(null);
        setNextBirthday(null);
      }
    } else {
      if (date1 && date2) calculateDiff(date1, date2);
      else {
        setAge(null);
        setNextBirthday(null);
      }
    }
  }, [date1, date2, mode]);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Try dd-mm-yy format (now more likely)
    const parts = dateStr.split(/[-/.]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      
      if (year < 100) {
        year += (year < 50) ? 2000 : 1900;
      }
      
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    
    const native = new Date(dateStr);
    return isNaN(native.getTime()) ? null : native;
  };

  const calculateDiff = (start: string, end: string) => {
    const d1 = parseDate(start);
    const d2 = new Date(); // Use actual current time for birthday mode
    const d2_comp = mode === 'birthday' ? d2 : parseDate(end);
    
    if (!d1 || !d2_comp) {
      setAge(null);
      setNextBirthday(null);
      return;
    }

    // Validation: Birthday cannot be in the future in Birthday mode
    if (mode === 'birthday' && d1 > d2_comp) {
      setAge(null);
      setNextBirthday(null);
      return;
    }

    const [birth, today] = d1 < d2_comp ? [d1, d2_comp] : [d2_comp, d1];
    
    // Age Calculation
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
      years--;
      months += 12;
    }

    if (days < 0) {
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
      months--;
    }

    setAge({ years, months, days });

    // Next Birthday Calculation
    if (mode === 'birthday') {
      let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      
      if (next < today) {
        next.setFullYear(today.getFullYear() + 1);
      }
      
      let nM = next.getMonth() - today.getMonth();
      let nD = next.getDate() - today.getDate();
      
      if (nD < 0) {
        const lastMonth = new Date(next.getFullYear(), next.getMonth(), 0);
        nD += lastMonth.getDate();
        nM--;
      }
      if (nM < 0) nM += 12;
      
      setNextBirthday({ months: nM, days: nD });
    }
  };

  return (
    <div className="glass-card">
      <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Age Calculator</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setMode('birthday')}
          style={{
            flex: 1,
            background: mode === 'birthday' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: mode === 'birthday' ? 'var(--bg-primary)' : 'var(--text-primary)',
            fontSize: '0.85rem'
          }}
        >
          Age from Birthday
        </button>
        <button
          onClick={() => setMode('gap')}
          style={{
            flex: 1,
            background: mode === 'gap' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: mode === 'gap' ? 'var(--bg-primary)' : 'var(--text-primary)',
            fontSize: '0.85rem'
          }}
        >
          Age Gap
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <CustomDateInput
            label={mode === 'birthday' ? 'Date of Birth' : 'First Date'}
            value={date1}
            onChange={setDate1}
          />

          {mode === 'gap' && (
            <CustomDateInput
              label="Second Date"
              value={date2}
              onChange={setDate2}
            />
          )}
        </div>

        {age && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              🎂 Current Age
            </div>
            <div className="responsive-grid-3">
              <div style={{ textAlign: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{age.years}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Years</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{age.months}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Months</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{age.days}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Days</div>
              </div>
            </div>
          </div>
        )}

        {nextBirthday && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Your {(!age && mode === 'birthday') ? 'Birthday' : 'Next Birthday'} will be in
            </div>
            <div className="responsive-grid-2" style={{ maxWidth: '300px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', background: 'rgba(var(--accent-primary-rgb), 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{nextBirthday.months}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Months</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(var(--accent-primary-rgb), 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{nextBirthday.days}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Days</div>
              </div>
            </div>
          </div>
        )}

        {!age && !nextBirthday && date1 && (mode === 'birthday' ? parseDate(date1) : (date1 && date2 && parseDate(date2))) && (
          <div style={{ 
            marginTop: '1.5rem', 
            textAlign: 'center', 
            color: '#ff4d4d', 
            fontSize: '0.85rem',
            padding: '1rem',
            background: 'rgba(255, 77, 77, 0.1)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 77, 77, 0.2)'
          }}>
            {mode === 'birthday' && parseDate(date1) && parseDate(date1)! > new Date() ? (
              <>
                <div>Birthdate cannot be in the future</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                  Today is {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}
                </div>
              </>
            ) : 'Please enter a valid date'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgeCalculator;
