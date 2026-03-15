import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import '../../styles/global.css';

type LogoPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type QrType = 'url' | 'text' | 'wifi' | 'vcard';

const QR_TYPES: { id: QrType; label: string; icon: string; desc: string }[] = [
  { id: 'url', label: 'URL', icon: '🔗', desc: 'Website link' },
  { id: 'wifi', label: 'WiFi', icon: '📶', desc: 'Network credentials' },
  { id: 'vcard', label: 'Contact', icon: '👤', desc: 'Business card' },
  { id: 'text', label: 'Text', icon: '📝', desc: 'Plain text' },
];

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

const QrGenerator: React.FC = () => {
  const [qrType, setQrType] = useState<QrType>('url');
  const [text, setText] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [vcName, setVcName] = useState('');
  const [vcPhone, setVcPhone] = useState('');
  const [vcEmail, setVcEmail] = useState('');
  const [vcOrg, setVcOrg] = useState('');
  const [vcUrl, setVcUrl] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrSize, setQrSize] = useState(300);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('center');
  const [logoBackground, setLogoBackground] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smart vCard composer
  const qrContent = useMemo(() => {
    switch (qrType) {
      case 'wifi':
        if (!wifiSsid) return '';
        return `WIFI:T:${wifiSecurity};S:${wifiSsid};P:${wifiPassword};;`;
      case 'vcard': {
        if (!vcName) return '';
        const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${vcName}`];
        if (vcOrg) lines.push(`ORG:${vcOrg}`);
        if (vcPhone) lines.push(`TEL:${vcPhone}`);
        if (vcEmail) lines.push(`EMAIL:${vcEmail}`);
        if (vcUrl) lines.push(`URL:${vcUrl}`);
        lines.push('END:VCARD');
        return lines.join('\n');
      }
      default:
        return text;
    }
  }, [qrType, text, wifiSsid, wifiPassword, wifiSecurity, vcName, vcPhone, vcEmail, vcOrg, vcUrl]);

  const hasContent = qrContent.length > 0;

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !qrContent) {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = 300;
            canvasRef.current.height = 300;
            ctx.clearRect(0, 0, 300, 300);
          }
          canvasRef.current.style.width = '100%';
          canvasRef.current.style.height = '100%';
          canvasRef.current.style.display = 'block';
        }
        return;
      }
      const currentErrorLevel = logo ? 'H' : errorLevel;
      try {
        await QRCode.toCanvas(canvasRef.current, qrContent, {
          width: qrSize,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: currentErrorLevel,
        });

        if (logoImage && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const size = qrSize;
            const isCenter = logoPosition === 'center';
            const logoSize = isCenter ? size * 0.22 : size * 0.18;
            let x = (size - logoSize) / 2;
            let y = (size - logoSize) / 2;
            const cornerOffset = size * 0.12;
            switch (logoPosition) {
              case 'top-left': x = cornerOffset; y = cornerOffset; break;
              case 'top-right': x = size - logoSize - cornerOffset; y = cornerOffset; break;
              case 'bottom-left': x = cornerOffset; y = size - logoSize - cornerOffset; break;
              case 'bottom-right': x = size - logoSize - cornerOffset; y = size - logoSize - cornerOffset; break;
            }
            if (logoBackground) {
              ctx.fillStyle = bgColor;
              const p = 4;
              ctx.fillRect(x - p, y - p, logoSize + p * 2, logoSize + p * 2);
            }
            ctx.drawImage(logoImage, x, y, logoSize, logoSize);
          }
        }

        if (canvasRef.current) {
          canvasRef.current.style.width = '100%';
          canvasRef.current.style.height = '100%';
          canvasRef.current.style.display = 'block';
        }
      } catch (err) {
        console.error(err);
      }
    };
    generateQR();
  }, [qrContent, fgColor, bgColor, errorLevel, qrSize, logo, logoImage, logoPosition, logoBackground]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogo(dataUrl);
        const img = new Image();
        img.onload = () => setLogoImage(img);
        img.src = dataUrl;
        setErrorLevel('H');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => { setLogo(null); setLogoImage(null); setLogoPosition('center'); };

  const downloadPNG = () => {
    if (!canvasRef.current || !hasContent) return;
    const link = document.createElement('a');
    link.download = `qr-${qrType}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const downloadSVG = async () => {
    if (!hasContent) return;
    try {
      const currentErrorLevel = logo ? 'H' : errorLevel;
      const svgString = await QRCode.toString(qrContent, {
        type: 'svg', width: qrSize, margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: currentErrorLevel,
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-${qrType}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.50rem', fontWeight: '500' }}>{label}</label>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.6rem', border: '1px solid var(--border-color)' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '36px', height: '36px', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{value}</span>
      </div>
    </div>
  );

  const Toggle = ({ label, desc, active, onToggle }: { label: string; desc: string; active: boolean; onToggle: () => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
      <div>
        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>{label}</span>
        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{desc}</span>
      </div>
      <div onClick={onToggle} style={{
        width: '44px', height: '24px',
        background: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
        borderRadius: '12px', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '2px',
          left: active ? '22px' : '2px',
          width: '20px', height: '20px',
          background: '#fff', borderRadius: '50%',
          transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem' }}>🔳</div>
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>QR Code Generator</h2>
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(0, 1fr)' }}>

        {/* Type Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {QR_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setQrType(t.id)}
              style={{
                background: qrType === t.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                color: qrType === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${qrType === t.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                padding: '0.85rem 0.5rem',
                borderRadius: '0.85rem',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
              <span>{t.label}</span>
              <span style={{ fontSize: '0.65rem', opacity: qrType === t.id ? 0.9 : 0.6 }}>{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
          {(qrType === 'url' || qrType === 'text') && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
                  {qrType === 'url' ? 'Target URL' : 'Text Content'}
                </label>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold' }}>{text.length} characters</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={qrType === 'url' ? 'https://example.com' : 'Type any text here...'}
                style={{
                  ...inputStyle,
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: qrType === 'url' ? 'monospace' : 'inherit',
                  padding: '1rem',
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          {qrType === 'wifi' && (
            <div className="fade-in" style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Network Name (SSID) *</label>
                <input type="text" value={wifiSsid} onChange={e => setWifiSsid(e.target.value)} placeholder="e.g. Home_Network" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>Password</label>
                <input type="text" value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="Minimum 8 characters" style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '500' }}>Encryption Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {(['WPA', 'WEP', 'nopass'] as const).map(s => (
                    <button key={s} onClick={() => setWifiSecurity(s)} style={{
                      padding: '0.6rem', fontSize: '0.85rem',
                      background: wifiSecurity === s ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                      color: wifiSecurity === s ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${wifiSecurity === s ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      borderRadius: '0.75rem',
                      fontWeight: '700',
                      transition: 'all 0.2s'
                    }}>
                      {s === 'nopass' ? 'None' : s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {qrType === 'vcard' && (
            <div className="fade-in" style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Full Name *</label>
                  <input type="text" value={vcName} onChange={e => setVcName(e.target.value)} placeholder="Name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Company</label>
                  <input type="text" value={vcOrg} onChange={e => setVcOrg(e.target.value)} placeholder="XYZ Corp" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Phone</label>
                  <input type="tel" value={vcPhone} onChange={e => setVcPhone(e.target.value)} placeholder="+1234..." style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Email</label>
                  <input type="email" value={vcEmail} onChange={e => setVcEmail(e.target.value)} placeholder="email@..." style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Website</label>
                <input type="url" value={vcUrl} onChange={e => setVcUrl(e.target.value)} placeholder="http://..." style={inputStyle} />
              </div>
            </div>
          )}
        </div>

        {/* Config + Preview Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

          {/* Settings Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <ColorPicker label="Pattern Color" value={fgColor} onChange={setFgColor} />
              <ColorPicker label="Background" value={bgColor} onChange={setBgColor} />
            </div>

            {/* Logo Settings */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{opacity: 0.6}}>🖼️</span> Logo Integration
              </h3>
              {!logo ? (
                <div
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  style={{
                    border: '2px dashed var(--border-color)', padding: '2rem 1.25rem',
                    borderRadius: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease',
                    background: 'rgba(255,255,255,0.02)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(56,189,248,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600', display: 'block' }}>Add a logo</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Centers or offsets in corners</span>
                  <input id="logo-upload" type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                </div>
              ) : (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                    <img src={logo} alt="logo" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain', background: '#fff', padding: '2px', border: '1px solid var(--border-color)' }} />
                    <div style={{ flex: 1 }}>
                       <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>Custom Logo</span>
                       <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Applied at High Correction</span>
                    </div>
                    <button onClick={clearLogo} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.6rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>

                  {/* Position Grid */}
                  <div style={{ padding: '0.5rem 0' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', fontWeight: '500' }}>Placement</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gridTemplateRows: 'repeat(3, 36px)', gap: '6px', width: 'fit-content' }}>
                      {[
                        ['top-left', null, 'top-right'],
                        [null, 'center', null],
                        ['bottom-left', null, 'bottom-right'],
                      ].flat().map((pos, idx) => (
                        <button
                          key={idx}
                          disabled={!pos}
                          onClick={() => pos && setLogoPosition(pos as LogoPosition)}
                          style={{
                            background: !pos ? 'transparent' : (logoPosition === pos ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)'),
                            border: pos ? '1px solid var(--border-color)' : 'none',
                            borderRadius: '6px', cursor: pos ? 'pointer' : 'default',
                            opacity: !pos ? 0 : 1, transition: 'all 0.2s',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <Toggle label="Logo Masking" desc="White background behind logo" active={logoBackground} onToggle={() => setLogoBackground(!logoBackground)} />
                </div>
              )}
            </div>

            {/* Error Correction */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Error Correction Level</label>
                <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>{logo ? 'H (Optimized for Logo)' : errorLevel}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {(['L', 'M', 'Q', 'H'] as const).map(level => (
                  <button key={level} disabled={!!logo} onClick={() => setErrorLevel(level)} style={{
                    background: (logo ? 'H' : errorLevel) === level ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                    color: (logo ? 'H' : errorLevel) === level ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${ (logo ? 'H' : errorLevel) === level ? 'var(--accent-primary)' : 'var(--border-color)'}`, 
                    padding: '0.6rem', 
                    borderRadius: '0.6rem', 
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    opacity: logo && level !== 'H' ? 0.35 : 1,
                    cursor: logo ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}>{level}</button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Render Resolution</label>
                <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{qrSize}px</span>
              </div>
              <input
                type="range" className="custom-slider"
                min="100" max="1000" step="10" value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                style={{ 
                  background: `linear-gradient(to right, var(--accent-primary) ${(qrSize - 100) / 900 * 100}%, rgba(255, 255, 255, 0.1) ${(qrSize - 100) / 900 * 100}%)`,
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Preview Column */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.15)', borderRadius: '1.5rem', padding: '2rem',
            minHeight: '380px', border: '1px solid var(--border-color)', minWidth: 0, overflow: 'hidden',
          }}>
            {!hasContent ? (
              <div className="fade-in" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }}>🔳</div>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>Awaiting content...</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem' }}>Enter text or WiFi info to see the QR</p>
              </div>
            ) : (
              <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: bgColor, padding: '1rem', borderRadius: '1rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 20px 50px -12px rgba(0,0,0,0.6)',
                  width: '100%', maxWidth: '280px', aspectRatio: '1/1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '280px', marginTop: '2rem' }}>
                  <button onClick={downloadPNG} style={{
                    background: 'var(--accent-primary)', color: 'var(--bg-primary)', padding: '0.85rem',
                    borderRadius: '0.75rem', fontWeight: '800', fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                  }}>
                    <span>⬇</span> PNG
                  </button>
                  <button onClick={downloadSVG} style={{
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', padding: '0.85rem',
                    borderRadius: '0.75rem', fontWeight: '800', fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    cursor: 'pointer'
                  }}>
                    <span>⬇</span> SVG
                  </button>
                </div>

                <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', opacity: 0.8 }}>
                   {qrContent.length} chars • {qrSize}×{qrSize}px
                </div>
              </div>
            )}
            {!hasContent && <canvas ref={canvasRef} style={{ display: 'none' }} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrGenerator;
