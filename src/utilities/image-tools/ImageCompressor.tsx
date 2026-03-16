import React, { useState, useCallback, useRef } from 'react';
import '../../styles/global.css';

type SizeUnit = 'KB' | 'MB';

const ImageCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{width: number, height: number} | null>(null);
  const [targetSize, setTargetSize] = useState<number>(200);
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('KB');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedResult, setCompressedResult] = useState<{
    url: string;
    size: number;
    quality: number;
    format: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processFile = useCallback((selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (compressedResult) URL.revokeObjectURL(compressedResult.url);

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setCompressedResult(null);
      setError(null);

      const img = new Image();
      img.onload = () => {
        setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    } else {
      setError('Please select a valid image file.');
    }
  }, [previewUrl, compressedResult]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const compressImage = async () => {
    if (!file || !previewUrl || !imageDims) return;
    setLoading(true);
    setProgress(0);
    setError(null);

    const targetSizeBytes = targetSize * (sizeUnit === 'KB' ? 1024 : 1024 * 1024);
    const format = file.type === 'image/png' ? 'image/png' : (file.type === 'image/webp' ? 'image/webp' : 'image/jpeg');

    // PNG is lossless in many browsers via toBlob quality, but let's try to convert to JPEG/WEBP if they want size reduction
    // or keep format if it supports quality (JPEG, WEBP)
    const compressionFormat = (format === 'image/png') ? 'image/jpeg' : format;

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      canvas.width = imageDims.width;
      canvas.height = imageDims.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Context not available');

      // Draw white background for transparent images being converted to JPEG
      if (compressionFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      let min = 0.01;
      let max = 1.0;
      let bestBlob: Blob | null = null;
      let bestQuality = 0.5;

      // Binary search for quality
      for (let i = 0; i < 8; i++) {
        const mid = (min + max) / 2;
        setProgress((i / 8) * 100);

        const blob = await new Promise<Blob | null>(resolve =>
          canvas.toBlob(resolve, compressionFormat, mid)
        );

        if (blob) {
          if (blob.size <= targetSizeBytes) {
            bestBlob = blob;
            bestQuality = mid;
            min = mid; // Try higher quality
          } else {
            max = mid; // Need lower quality
          }
        }
      }

      // Final attempt if nothing found within target (take lowest quality)
      if (!bestBlob) {
        bestQuality = 0.01;
        bestBlob = await new Promise<Blob | null>(resolve =>
          canvas.toBlob(resolve, compressionFormat, 0.01)
        );
      }

      if (bestBlob) {
        if (compressedResult) URL.revokeObjectURL(compressedResult.url);
        setCompressedResult({
          url: URL.createObjectURL(bestBlob),
          size: bestBlob.size,
          quality: bestQuality,
          format: compressionFormat
        });
      } else {
        throw new Error('Compression failed');
      }
    } catch (err) {
      setError('An error occurred during compression.');
      console.error(err);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handleDownload = () => {
    if (!compressedResult || !file) return;
    const extension = compressedResult.format.split('/')[1] || 'jpg';
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const newName = `${originalName}_compressed.${extension}`;

    const a = document.createElement('a');
    a.href = compressedResult.url;
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (compressedResult) URL.revokeObjectURL(compressedResult.url);
    setFile(null);
    setPreviewUrl(null);
    setCompressedResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem' }}>📉</div>
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>Image Compressor</h2>
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
            accept="image/png, image/jpeg, image/webp, .jpg, .jpeg, .png, .webp"
            onChange={onFileChange}
          />
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.8 }}>📉</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Click or drag & drop an image
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            PNG, JPG, or WEBP • Stays on your computer
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

          <div className="responsive-grid-2" style={{ gap: '2rem' }}>
            {/* Settings Column */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ opacity: 0.6 }}>⚙️</span> Compression Settings
               </h3>

               <div style={{ marginBottom: '1.5rem' }}>
                 <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '500' }}>Target File Size</label>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      value={targetSize}
                      onChange={(e) => setTargetSize(parseFloat(e.target.value) || 0)}
                      className="no-spinner"
                      style={{
                        flex: 2,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        padding: '0.6rem 1rem',
                        borderRadius: '0.75rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                    <select
                      value={sizeUnit}
                      onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        padding: '0.6rem',
                        borderRadius: '0.75rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                 </div>
               </div>

               <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                 The algorithm will find the highest quality that fits within your target size.
               </p>

               {compressedResult && (
                 <div className="fade-in" style={{
                   marginTop: '0.5rem',
                   padding: '1.25rem',
                   background: 'rgba(255,255,255,0.03)',
                   borderRadius: '1rem',
                   border: '1px solid var(--border-color)'
                 }}>
                   <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     📊 Compression Metrics
                   </h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                       <span style={{ color: 'var(--text-secondary)' }}>Original Size:</span>
                       <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{(file.size / 1024).toFixed(1)} KB</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                       <span style={{ color: 'var(--text-secondary)' }}>Compressed Size:</span>
                       <span style={{ color: '#4ade80', fontWeight: '600' }}>{(compressedResult.size / 1024).toFixed(1)} KB</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                       <span style={{ color: 'var(--text-secondary)' }}>Compression Ratio:</span>
                       <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{((1 - compressedResult.size / file.size) * 100).toFixed(1)}%</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                       <span style={{ color: 'var(--text-secondary)' }}>Final Quality:</span>
                       <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{Math.round(compressedResult.quality * 100)}%</span>
                     </div>
                   </div>
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

              {loading && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Compressing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--accent-primary)', width: `${progress}%`, transition: 'width 0.2s ease' }} />
                  </div>
                </div>
              )}

              {!compressedResult ? (
                <button
                  onClick={compressImage}
                  disabled={loading || targetSize <= 0}
                  style={{
                    width: '100%',
                    background: loading || targetSize <= 0 ? 'rgba(56, 189, 248, 0.3)' : 'var(--accent-primary)',
                    color: 'var(--bg-primary)',
                    padding: '1.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    borderRadius: '1.25rem',
                    border: 'none',
                    cursor: loading || targetSize <= 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: loading || targetSize <= 0 ? 'none' : '0 8px 25px rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {loading ? 'Processing...' : 'Compress Image'}
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
                      <span>✓</span> Compression Complete
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
                    >
                      <span>⬇️</span> Download Image
                    </button>

                    <button
                       onClick={() => setCompressedResult(null)}
                       style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Adjust Target Size
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

export default ImageCompressor;
