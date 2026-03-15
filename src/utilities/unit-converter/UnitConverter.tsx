import React, { useState, useEffect } from 'react';
import { useStorage } from '../../hooks/useStorage';

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'data' | 'time';

interface Unit {
  label: string;
  value: string;
  factor?: number; // Relative to base unit
}

const UNITS: Record<Category, Unit[]> = {
  length: [
    { label: 'Millimeters (mm)', value: 'mm', factor: 0.001 },
    { label: 'Centimeters (cm)', value: 'cm', factor: 0.01 },
    { label: 'Inches (in)', value: 'in', factor: 0.0254 },
    { label: 'Feet (ft)', value: 'ft', factor: 0.3048 },
    { label: 'Meters (m)', value: 'm', factor: 1 },
    { label: 'Kilometers (km)', value: 'km', factor: 1000 },
    { label: 'Miles (mi)', value: 'mi', factor: 1609.34 },
  ],
  weight: [
    { label: 'Milligrams (mg)', value: 'mg', factor: 0.000001 },
    { label: 'Grams (g)', value: 'g', factor: 0.001 },
    { label: 'Ounces (oz)', value: 'oz', factor: 0.0283495 },
    { label: 'Pounds (lb)', value: 'lb', factor: 0.453592 },
    { label: 'Kilograms (kg)', value: 'kg', factor: 1 },
  ],
  temperature: [
    { label: 'Celsius (°C)', value: 'c' },
    { label: 'Fahrenheit (°F)', value: 'f' },
    { label: 'Kelvin (K)', value: 'k' },
  ],
  area: [
    { label: 'Square Feet (ft²)', value: 'ft2', factor: 0.092903 },
    { label: 'Square Meters (m²)', value: 'm2', factor: 1 },
    { label: 'Acre (ac)', value: 'ac', factor: 4046.86 },
    { label: 'Hectare (ha)', value: 'ha', factor: 10000 },
    { label: 'Square Kilometers (km²)', value: 'km2', factor: 1000000 },
    { label: 'Square Miles (mi²)', value: 'mi2', factor: 2589988.11 },
  ],
  data: [
    { label: 'Bits (bit)', value: 'bit', factor: 0.125 },
    { label: 'Bytes (B)', value: 'b', factor: 1 },
    { label: 'Kilobits (Kb)', value: 'kb_bit', factor: 128 },
    { label: 'Kilobytes (KB)', value: 'kb', factor: 1024 },
    { label: 'Megabits (Mb)', value: 'mb_bit', factor: 131072 },
    { label: 'Megabytes (MB)', value: 'mb', factor: 1048576 },
    { label: 'Gigabits (Gb)', value: 'gb_bit', factor: 134217728 },
    { label: 'Gigabytes (GB)', value: 'gb', factor: 1073741824 },
    { label: 'Terabytes (TB)', value: 'tb', factor: 1099511627776 },
  ],
  time: [
    { label: 'Milliseconds (ms)', value: 'ms', factor: 0.001 },
    { label: 'Seconds (s)', value: 's', factor: 1 },
    { label: 'Minutes (min)', value: 'min', factor: 60 },
    { label: 'Hours (h)', value: 'h', factor: 3600 },
    { label: 'Days (d)', value: 'd', factor: 86400 },
    { label: 'Weeks (wk)', value: 'wk', factor: 604800 },
    { label: 'Years (yr)', value: 'yr', factor: 31536000 },
  ],
};

const UnitConverter: React.FC = () => {
  const [category, setCategory] = useStorage<Category>('unit-conv-cat', 'length');
  const [fromUnit, setFromUnit] = useStorage<string>('unit-conv-from', 'm');
  const [toUnit, setToUnit] = useStorage<string>('unit-conv-to', 'km');
  const [inputValue, setInputValue] = useState<string>('1');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    // Reset units when category changes if they are not in the new category
    const availableUnits = UNITS[category].map(u => u.value);
    if (!availableUnits.includes(fromUnit)) setFromUnit(availableUnits[0]);
    if (!availableUnits.includes(toUnit)) setToUnit(availableUnits[1] || availableUnits[0]);
  }, [category]);

  const convert = (value: number, from: string, to: string, cat: Category): number => {
    if (cat === 'temperature') {
      let celsius = value;
      if (from === 'f') celsius = (value - 32) * 5 / 9;
      if (from === 'k') celsius = value - 273.15;

      if (to === 'c') return celsius;
      if (to === 'f') return (celsius * 9 / 5) + 32;
      if (to === 'k') return celsius + 273.15;
      return celsius;
    }

    const units = UNITS[cat];
    const fromFactor = units.find(u => u.value === from)?.factor || 1;
    const toFactor = units.find(u => u.value === to)?.factor || 1;
    return (value * fromFactor) / toFactor;
  };

  useEffect(() => {
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      setResult(convert(val, fromUnit, toUnit, category));
    } else {
      setResult(null);
    }
  }, [inputValue, fromUnit, toUnit, category]);

  return (
    <div className="glass-card">
      <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Unit Converter</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {(Object.keys(UNITS) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              background: category === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: category === cat ? 'var(--bg-primary)' : 'var(--text-primary)',
              textTransform: 'capitalize'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="responsive-grid-2">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.5rem',
                borderRadius: '0.375rem'
              }}
            >
              {UNITS[category].map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>To</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.5rem',
                borderRadius: '0.375rem'
              }}
            >
              {UNITS[category].map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Value</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ width: '100%', fontSize: '1.2rem' }}
          />
        </div>

        {result !== null && (
          <div style={{
            marginTop: '1rem',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Result</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', wordBreak: 'break-all' }}>
              {result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              {UNITS[category].find(u => u.value === toUnit)?.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitConverter;
