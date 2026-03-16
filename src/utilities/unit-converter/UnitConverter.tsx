import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStorage } from '../../hooks/useStorage';
import '../../styles/global.css';

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'data' | 'time' | 'currency';

interface Unit {
  label: string;
  value: string;
  factor?: number; // Relative to base unit
  symbol?: string;
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
  currency: [
    { label: 'US Dollar (USD)', value: 'USD', factor: 1, symbol: '$' },
    { label: 'Euro (EUR)', value: 'EUR', factor: 1, symbol: '€' },
    { label: 'British Pound (GBP)', value: 'GBP', factor: 1, symbol: '£' },
    { label: 'Indian Rupee (INR)', value: 'INR', factor: 1, symbol: '₹' },
    { label: 'Japanese Yen (JPY)', value: 'JPY', factor: 1, symbol: '¥' },
    { label: 'Chinese Yuan (CNY)', value: 'CNY', factor: 1, symbol: '¥' },
    { label: 'Singapore Dollar (SGD)', value: 'SGD', factor: 1, symbol: 'S$' },
    { label: 'South Korean Won (KRW)', value: 'KRW', factor: 1, symbol: '₩' },
    { label: 'Thai Baht (THB)', value: 'THB', factor: 1, symbol: '฿' },
    { label: 'Indonesian Rupiah (IDR)', value: 'IDR', factor: 1, symbol: 'Rp' },
    { label: 'Malaysian Ringgit (MYR)', value: 'MYR', factor: 1, symbol: 'RM' },
    { label: 'UAE Dirham (AED)', value: 'AED', factor: 1, symbol: 'د.إ' },
    { label: 'Saudi Riyal (SAR)', value: 'SAR', factor: 1, symbol: '﷼' },
    { label: 'Pakistani Rupee (PKR)', value: 'PKR', factor: 1, symbol: '₨' },
    { label: 'Bangladesh Taka (BDT)', value: 'BDT', factor: 1, symbol: '৳' },
    { label: 'Vietnamese Dong (VND)', value: 'VND', factor: 1, symbol: '₫' },
    { label: 'Philippine Peso (PHP)', value: 'PHP', factor: 1, symbol: '₱' },
    { label: 'Australian Dollar (AUD)', value: 'AUD', factor: 1, symbol: 'A$' },
    { label: 'Canadian Dollar (CAD)', value: 'CAD', factor: 1, symbol: 'C$' },
    { label: 'Swiss Franc (CHF)', value: 'CHF', factor: 1, symbol: 'Fr' },
  ],
};

const UnitConverter: React.FC = () => {
  const [category, setCategory] = useStorage<Category>('unit-conv-cat', 'length');
  const [fromUnit, setFromUnit] = useStorage<string>('unit-conv-from', 'm');
  const [toUnit, setToUnit] = useStorage<string>('unit-conv-to', 'km');
  const [inputValue, setInputValue] = useState<string>('1');

  // Currency state
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState(false);

  useEffect(() => {
    if (category === 'currency' && Object.keys(rates).length === 0) {
      setLoadingRates(true);
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => {
          setRates(data.rates);
          setLoadingRates(false);
        })
        .catch(() => setLoadingRates(false));
    }
  }, [category, rates]);

  useEffect(() => {
    const availableUnits = UNITS[category].map(u => u.value);
    if (!availableUnits.includes(fromUnit)) setFromUnit(availableUnits[0]);
    
    if (category === 'currency') {
      if (!fromUnit || !UNITS.currency.find(u => u.value === fromUnit)) setFromUnit('USD');
      if (!toUnit || !UNITS.currency.find(u => u.value === toUnit)) setToUnit('INR');
    } else {
      if (!availableUnits.includes(toUnit)) setToUnit(availableUnits[1] || availableUnits[0]);
    }
  }, [category, fromUnit, toUnit, setFromUnit, setToUnit]);

  const convert = useCallback((value: number, from: string, to: string, cat: Category, currencyRates: Record<string, number>): number => {
    if (cat === 'temperature') {
      let celsius = value;
      if (from === 'f') celsius = (value - 32) * 5 / 9;
      if (from === 'k') celsius = value - 273.15;

      if (to === 'c') return celsius;
      if (to === 'f') return (celsius * 9 / 5) + 32;
      if (to === 'k') return celsius + 273.15;
      return celsius;
    }

    if (cat === 'currency') {
      const fromRate = currencyRates[from] || 1;
      const toRate = currencyRates[to] || 1;
      return (value / fromRate) * toRate;
    }

    const units = UNITS[cat];
    const fromFactor = units.find(u => u.value === from)?.factor || 1;
    const toFactor = units.find(u => u.value === to)?.factor || 1;
    return (value * fromFactor) / toFactor;
  }, []);

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return null;
    return convert(val, fromUnit, toUnit, category, rates);
  }, [inputValue, fromUnit, toUnit, category, convert, rates]);

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
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem' }}>📐</div>
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>Unit Converter</h2>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.6rem', 
        marginBottom: '2rem',
      }}>
        {(Object.keys(UNITS) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              background: category === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
              color: category === cat ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${category === cat ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Enter Value</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ ...inputStyle, fontSize: '1.25rem', fontWeight: 'bold' }}
            placeholder="0.00"
          />
        </div>

        <div className="responsive-grid-2" style={{ gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              style={inputStyle}
            >
              {UNITS[category].map(u => <option key={u.value} value={u.value} style={{ background: '#0f172a' }}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>To</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              style={inputStyle}
            >
              {UNITS[category].map(u => <option key={u.value} value={u.value} style={{ background: '#0f172a' }}>{u.label}</option>)}
            </select>
          </div>
        </div>

        {loadingRates ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <span style={{ fontSize: '0.9rem' }}>Fetching live rates...</span>
          </div>
        ) : result !== null && (
          <div className="fade-in" style={{
            marginTop: '1rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))',
            borderRadius: '1.25rem',
            textAlign: 'center',
            border: '1px solid rgba(16,185,129,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{ 
               position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', opacity: 0.05, pointerEvents: 'none' 
             }}>✨</div>

             {category === 'currency' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold' }}>
                  Exchange Rate
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right', flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {UNITS.currency.find(u => u.value === fromUnit)?.symbol} {parseFloat(inputValue).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{fromUnit}</div>
                  </div>

                  <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>→</div>

                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {UNITS.currency.find(u => u.value === toUnit)?.symbol} {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{toUnit}</div>
                  </div>
                </div>
                
                <div style={{ 
                  borderTop: '1px solid rgba(255,255,255,0.05)', 
                  paddingTop: '1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  1 {fromUnit} ≈ {(result / parseFloat(inputValue)).toFixed(4)} {toUnit}
                  <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
                    Live rates via ExchangeRate-API
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Result
                </div>
                <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1 }}>
                  {result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '0.5rem' }}>
                  {UNITS[category].find(u => u.value === toUnit)?.label}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitConverter;
