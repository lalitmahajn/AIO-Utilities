import React, { useState, useCallback, useRef, useEffect } from 'react';
import '../../styles/global.css';

type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

const FORMAT_LABELS: Record<ImageFormat, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WEBP',
};

const ImageConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{width: number, height: number} | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState<number>(0.8);
  const [transparentBg, setTransparentBg] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Debounced effect for live size estimation
  useEffect(() => {
    if (!file || !previewUrl || !imageDims) {
      setEstimatedSize(null);
      return;
    }

    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imageDims.width;
        canvas.height = imageDims.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (targetFormat === 'image/jpeg' || (targetFormat === 'image/webp' && !transparentBg) || (targetFormat === 'image/png' && !transparentBg)) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) setEstimatedSize(blob.size);
        }, targetFormat, quality);
      };
      img.src = previewUrl;
    }, 300);

    return () => clearTimeout(timer);
  }, [file, previewUrl, imageDims, targetFormat, quality, transparentBg]);

  const processFile = (selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setConvertedUrl(null);
      setError(null);
      
      const img = new Image();
      img.onload = () => {
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    } else {
      setError('Please select a valid image file.');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleConvert = async () => {
    if (!file || !previewUrl || !imageDims) return;
    setLoading(true);
    setError(null);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas not available');
        
        canvas.width = imageDims.width;
        canvas.height = imageDims.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        if (targetFormat === 'image/jpeg' || !transparentBg) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL(targetFormat, quality);
        setConvertedUrl(dataUrl);
        setLoading(false);
      };

      img.onerror = () => {
        setError('Failed to read image data.');
        setLoading(false);
      };

      img.src = previewUrl;
    } catch (err: any) {
      setError('An error occurred during conversion.');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!convertedUrl || !file) return;
    const extension = targetFormat.split('/')[1];
    const originalName = file.name.split('.')[0];
    const newName = `${originalName}_converted.${extension}`;

    const a = document.createElement('a');
    a.href = convertedUrl;
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setConvertedUrl(null);
    setError(null);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem' }}>🖼️</div>
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>Image Converter</h2>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!file ? (
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '1.25rem',
            padding: '5rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'rgba(255, 255, 255, 0.02)',
            position: 'relative'
          }}
          onClick={() => document.getElementById('image-input')?.click()}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          }}
        >
          <input 
            type="file" 
            id="image-input" 
            hidden 
            accept="image/png, image/jpeg, image/webp, image/svg+xml, .jpg, .jpeg, .png, .webp, .svg" 
            onChange={onFileChange} 
          />
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.8 }}>🖼️</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Click or drag & drop an image
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            PNG, JPG, WEBP, or SVG • Stays on your computer
          </p>
        </div>
      ) : (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* File Overview Card */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.03)', 
            padding: '1.25rem', 
            borderRadius: '1.25rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '0.75rem', 
                overflow: 'hidden',
                background: '#fff',
                backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '300px', fontSize: '1.1rem' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {imageDims ? `${imageDims.width} × ${imageDims.height} px • ` : ''} 
                  {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}
                </div>
              </div>
            </div>
            <button 
              onClick={reset}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#f87171', 
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Settings Column */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
               <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ opacity: 0.6 }}>⚙️</span> Conversion Settings
               </h3>
               
               <div style={{ marginBottom: '1.5rem' }}>
                 <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '500' }}>Target Format</label>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   {(Object.keys(FORMAT_LABELS) as ImageFormat[]).map((fmt) => (
                     <button
                       key={fmt}
                       onClick={() => {
                          setTargetFormat(fmt);
                          setConvertedUrl(null);
                          if (fmt !== 'image/png') setTransparentBg(false);
                       }}
                       style={{
                         flex: 1,
                         background: targetFormat === fmt ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                         color: targetFormat === fmt ? 'var(--bg-primary)' : 'var(--text-secondary)',
                         border: `1px solid ${targetFormat === fmt ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                         padding: '0.6rem',
                         borderRadius: '0.75rem',
                         fontWeight: '700',
                         fontSize: '0.85rem',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                     >
                       {FORMAT_LABELS[fmt]}
                     </button>
                   ))}
                 </div>
               </div>

               {targetFormat === 'image/png' && (
                 <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.85rem', border: '1px solid var(--border-color)' }}>
                   <div>
                     <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600' }}>Transparency</span>
                     <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Keep background clear</span>
                   </div>
                   <div
                     onClick={() => { setTransparentBg(!transparentBg); setConvertedUrl(null); }}
                     style={{
                       width: '44px', height: '24px',
                       background: transparentBg ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                       borderRadius: '12px',
                       cursor: 'pointer',
                       position: 'relative',
                       transition: 'all 0.2s'
                     }}
                   >
                     <div style={{
                       position: 'absolute',
                       top: '2px',
                       left: transparentBg ? '22px' : '2px',
                       width: '20px', height: '20px',
                       background: '#fff',
                       borderRadius: '50%',
                       transition: 'all 0.2s',
                       boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                     }} />
                   </div>
                 </div>
               )}

               {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
                 <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Quality</label>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>{Math.round(quality * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      className="custom-slider"
                      min="0.1" 
                      max="1" 
                      step="0.1" 
                      value={quality} 
                      onChange={(e) => {
                         setQuality(parseFloat(e.target.value));
                         setConvertedUrl(null);
                      }}
                      style={{
                        background: `linear-gradient(to right, var(--accent-primary) ${(quality - 0.1) / 0.9 * 100}%, rgba(255, 255, 255, 0.1) ${(quality - 0.1) / 0.9 * 100}%)`,
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    />
                 </div>
               )}

               {estimatedSize && !convertedUrl && (
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                   <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Est. Output Size:</span>
                   <strong style={{ color: '#4ade80', fontSize: '0.9rem' }}>{(estimatedSize / 1024).toFixed(1)} KB</strong>
                 </div>
               )}
            </div>

            {/* Action Column */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '1rem', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {!convertedUrl ? (
                <button 
                  onClick={handleConvert}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? 'rgba(56, 189, 248, 0.3)' : 'var(--accent-primary)',
                    color: 'var(--bg-primary)',
                    padding: '1.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    borderRadius: '1.25rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: loading ? 'none' : '0 8px 25px rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {loading ? 'Processing...' : 'Start Conversion'}
                </button>
              ) : (
                 <div className="fade-in" style={{ 
                   textAlign: 'center', 
                   padding: '2rem', 
                   background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02))', 
                   borderRadius: '1.5rem', 
                   border: '1px solid rgba(56,189,248,0.2)',
                   position: 'relative',
                   overflow: 'hidden'
                 }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.05, pointerEvents: 'none' }}>✨</div>
                    <div style={{ display: 'inline-flex', padding: '0.4rem 1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '2rem', fontSize: '0.85rem', marginBottom: '1.25rem', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                      <span>✓</span> Ready to Download
                    </div>
                    
                    <button 
                      onClick={handleDownload}
                      style={{
                        width: '100%',
                        background: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        borderRadius: '1rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <span>⬇️</span> Download {FORMAT_LABELS[targetFormat]}
                    </button>

                    <button 
                       onClick={() => setConvertedUrl(null)}
                       style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Adjust Settings
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageConverter;
