import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import '../../styles/global.css';

const PdfPasswordRemover: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockedFile, setUnlockedFile] = useState<{ blob: Blob; name: string } | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUnlockedFile(null);
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUnlockedFile(null);
      setError(null);
    } else {
      setError('Please drop a valid PDF file.');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUnlock = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      let decryptedBuffer: Uint8Array;
      try {
        decryptedBuffer = await decryptPDF(new Uint8Array(arrayBuffer), password);
      } catch (err: any) {
         if (err.message && err.message.toLowerCase().includes('password')) {
           throw new Error('incorrect password');
         }
         throw err;
      }

      const pdfDoc = await PDFDocument.load(decryptedBuffer);
      const unlockedPdf = await PDFDocument.create();
      const pageIndices = pdfDoc.getPageIndices();
      const copiedPages = await unlockedPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach((page) => unlockedPdf.addPage(page));

      const pdfBytes = await unlockedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      
      setUnlockedFile({
        blob,
        name: file.name.replace('.pdf', '_unlocked.pdf')
      });
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      if (err.message?.includes('incorrect password')) {
        setError('Incorrect password. Please try again.');
      } else if (err.message?.includes('not encrypted')) {
        setError('This PDF is not password protected.');
      } else {
        setError('Failed to process PDF. Make sure the password is correct.');
      }
    }
  };

  const handleDownload = () => {
    if (!unlockedFile) return;
    const url = URL.createObjectURL(unlockedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = unlockedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setUnlockedFile(null);
    setError(null);
  };

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
        <div style={{ fontSize: '2rem' }}>🔓</div>
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.75rem' }}>PDF Password Remover</h2>
      </div>
      
      {!file ? (
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '1.25rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'rgba(255, 255, 255, 0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => document.getElementById('pdf-input')?.click()}
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
            id="pdf-input" 
            hidden 
            accept=".pdf" 
            onChange={onFileChange} 
          />
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>📄</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Click to upload or drag & drop PDF
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Privacy first: Your file never leaves your device.
          </p>
        </div>
      ) : (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.03)', 
            padding: '1.25rem', 
            borderRadius: '1rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>📄</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '250px' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button 
              onClick={reset}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#f87171', 
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          </div>

          {!unlockedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Enter PDF Password</label>
                <input 
                  type="password" 
                  placeholder="Password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, padding: '0.85rem' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>

              {error && (
                <div style={{ 
                  padding: '1rem', 
                  background: 'rgba(239, 68, 68, 0.08)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  color: '#f87171', 
                  borderRadius: '0.75rem', 
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <button 
                onClick={handleUnlock}
                disabled={loading || !password}
                style={{
                  width: '100%',
                  background: loading || !password ? 'rgba(56, 189, 248, 0.3)' : 'var(--accent-primary)',
                  color: 'var(--bg-primary)',
                  padding: '1rem',
                  fontSize: '1rem',
                  borderRadius: '0.75rem',
                  fontWeight: 'bold',
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  border: 'none'
                }}
              >
                {loading ? 'Decrypting...' : 'Remove Password'}
              </button>
            </div>
          ) : (
            <div className="fade-in" style={{ 
              textAlign: 'center', 
              padding: '2.5rem',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))',
              borderRadius: '1.5rem',
              border: '1px solid rgba(16,185,129,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
               <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.05, pointerEvents: 'none' }}>🎉</div>
               <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
               <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: '800' }}>Unlocked!</h3>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                 Your PDF is now decrypted and ready for download.
               </p>
               
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button 
                    onClick={handleDownload}
                    style={{
                      flex: 1.5,
                      background: 'var(--accent-primary)',
                      color: 'var(--bg-primary)',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                    }}
                 >
                   Download File
                 </button>
                 <button 
                    onClick={reset}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                 >
                   Start Over
                 </button>
               </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '3rem', padding: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🛡️</span>
        <div style={{ lineHeight: '1.4' }}>
          <strong>Privacy Guaranteed:</strong> This process happens entirely within your browser. Neither your file nor your password ever reaches our servers.
        </div>
      </div>
    </div>
  );
};

export default PdfPasswordRemover;
