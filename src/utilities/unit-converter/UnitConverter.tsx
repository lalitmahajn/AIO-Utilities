import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStorage } from '../../hooks/useStorage';

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
    // Reset units when category changes if they are not in the new category
    const availableUnits = UNITS[category].map(u => u.value);
    if (!availableUnits.includes(fromUnit)) setFromUnit(availableUnits[0]);
    
    // For currency, default to USD to INR if available
    if (category === 'currency') {
      if (!fromUnit || fromUnit === 'm') setFromUnit('USD');
      if (!toUnit || toUnit === 'km') setToUnit('INR');
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
      // Rates are relative to USD
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

        {loadingRates ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Fetching live rates...
          </div>
        ) : result !== null && (
          <div style={{
            marginTop: '1rem',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid var(--glass-border)'
          }}>
             {category === 'currency' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Exchange Rate Comparison</div>
                <div className="currency-comparison">
                  <div className="currency-box">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>From</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {UNITS.currency.find(u => u.value === fromUnit)?.symbol} {parseFloat(inputValue).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', marginTop: '0.25rem' }}>{fromUnit}</div>
                  </div>

                  <div className="currency-arrow">→</div>

                  <div className="currency-box target">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>To</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                      {UNITS.currency.find(u => u.value === toUnit)?.symbol} {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>{toUnit}</div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    1 {fromUnit} ≈ {(result / parseFloat(inputValue)).toFixed(4)} {toUnit}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '0.5rem' }}>
                    Rates are live via ExchangeRate-API.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Result</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', wordBreak: 'break-all' }}>
                  {result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                  {UNITS[category].find(u => u.value === toUnit)?.label}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitConverter;
