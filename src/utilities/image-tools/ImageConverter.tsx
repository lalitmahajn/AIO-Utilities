import React, { useState, useCallback, useRef, useEffect } from 'react';

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
        
        if (targetFormat === 'image/jpeg') {
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
  }, [file, previewUrl, imageDims, targetFormat, quality]);

  const processFile = (selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setConvertedUrl(null);
      setError(null);
      
      // Load image to get dimensions
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

        // Fill background with white if converting to JPEG (since JPEGs don't support transparency)
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        // Convert to target format
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
    <div className="glass-card">
      <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Image Format Converter</h2>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!file ? (
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed var(--glass-border)',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
          onClick={() => document.getElementById('image-input')?.click()}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
        >
          <input 
            type="file" 
            id="image-input" 
            hidden 
            accept="image/png, image/jpeg, image/webp, image/svg+xml, .jpg, .jpeg, .png, .webp, .svg" 
            onChange={onFileChange} 
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '1.2rem' }}>Click or drag & drop an image</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Supports PNG, JPG, WEBP, and SVG</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 1fr)' }}>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'var(--bg-secondary)', 
            padding: '1rem', 
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '0.5rem', 
                overflow: 'hidden',
                background: '#fff', // White background for transparent PNG/SVG preview
                backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid var(--border-color)'
              }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '200px' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {imageDims ? `${imageDims.width} × ${imageDims.height} px • ` : ''} 
                  {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}
                </div>
              </div>
            </div>
            <button 
              onClick={reset}
              style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem' }}
            >
              Change
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
             <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Conversion Settings</h3>
             
             <div style={{ marginBottom: '1.5rem' }}>
               <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Target Format</label>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                 {(Object.keys(FORMAT_LABELS) as ImageFormat[]).map((fmt) => (
                   <button
                     key={fmt}
                     onClick={() => {
                        setTargetFormat(fmt);
                        setConvertedUrl(null);
                     }}
                     style={{
                       background: targetFormat === fmt ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                       color: targetFormat === fmt ? 'var(--bg-primary)' : 'var(--text-primary)',
                       border: `1px solid ${targetFormat === fmt ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                       padding: '0.75rem',
                       fontWeight: targetFormat === fmt ? 'bold' : 'normal',
                     }}
                   >
                     {FORMAT_LABELS[fmt]}
                   </button>
                 ))}
               </div>
             </div>

             {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
               <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Quality</label>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{Math.round(quality * 100)}%</span>
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
                      background: `linear-gradient(to right, var(--accent-primary) ${(quality - 0.1) / 0.9 * 100}%, rgba(255, 255, 255, 0.1) ${(quality - 0.1) / 0.9 * 100}%)`
                    }}
                  />
               </div>
             )}

             {estimatedSize && !convertedUrl && (
               <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estimated Output Size:</span>
                 <strong style={{ color: 'var(--text-primary)' }}>{(estimatedSize / 1024).toFixed(1)} KB</strong>
               </div>
             )}

             {error && (
               <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                 ⚠️ {error}
               </div>
             )}

             {!convertedUrl ? (
               <button 
                 onClick={handleConvert}
                 disabled={loading}
                 style={{
                   width: '100%',
                   background: 'var(--accent-primary)',
                   color: 'var(--bg-primary)',
                   padding: '1rem',
                   fontSize: '1rem',
                   fontWeight: 'bold',
                   opacity: loading ? 0.7 : 1
                 }}
               >
                 {loading ? 'Converting...' : 'Convert Image'}
               </button>
             ) : (
                <div style={{ textAlign: 'center' }}>
                   <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '2rem', fontSize: '0.9rem', marginBottom: '1rem', alignItems: 'center', gap: '0.5rem' }}>
                     ✓ Conversion Complete
                   </div>
                   <button 
                     onClick={handleDownload}
                     style={{
                       width: '100%',
                       background: 'var(--text-primary)',
                       color: 'var(--bg-primary)',
                       padding: '1rem',
                       fontSize: '1rem',
                       fontWeight: 'bold',
                       display: 'flex',
                       justifyContent: 'center',
                       alignItems: 'center',
                       gap: '0.5rem'
                     }}
                   >
                     <span>⬇️</span> Download {FORMAT_LABELS[targetFormat]}
                   </button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageConverter;
