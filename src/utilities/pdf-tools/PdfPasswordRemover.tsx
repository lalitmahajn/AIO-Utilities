import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';

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
        // First, natively decrypt the PDF using the provided password
        decryptedBuffer = await decryptPDF(new Uint8Array(arrayBuffer), password);
      } catch (err: any) {
         if (err.message && err.message.toLowerCase().includes('password')) {
           throw new Error('incorrect password');
         }
         throw err;
      }

      // Load the now-decrypted PDF into pdf-lib to ensure structural integrity and strip any residual security metadata
      const pdfDoc = await PDFDocument.load(decryptedBuffer);

      // Create a new PDF and copy pages to ensure it's completely unencrypted
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

  return (
    <div className="glass-card">
      <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>PDF Password Remover</h2>
      
      {!file ? (
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed var(--glass-border)',
            borderRadius: '1rem',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
          onClick={() => document.getElementById('pdf-input')?.click()}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
        >
          <input 
            type="file" 
            id="pdf-input" 
            hidden 
            accept=".pdf" 
            onChange={onFileChange} 
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Click to upload or drag & drop PDF</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Your file stays on your computer</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'var(--bg-secondary)', 
            padding: '1rem', 
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📄</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '200px' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
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

          {!unlockedFile ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter PDF Password</label>
                <input 
                  type="password" 
                  placeholder="Password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>

              {error && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  color: '#f87171', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.85rem' 
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button 
                onClick={handleUnlock}
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
                {loading ? 'Processing...' : 'Remove Password'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Password Removed Successfully!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                You can now download the unlocked version of your PDF.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                   onClick={handleDownload}
                   style={{
                     flex: 1,
                     background: 'var(--accent-primary)',
                     color: 'var(--bg-primary)',
                     padding: '1rem',
                     fontWeight: 'bold'
                   }}
                >
                  Download Unlocked PDF
                </button>
                <button 
                   onClick={reset}
                   style={{
                     background: 'var(--bg-secondary)',
                     color: 'var(--text-primary)',
                     padding: '1rem'
                   }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <p>🛡️ <strong>Privacy Note:</strong> This tool runs entirely in your browser. Your PDF file and password are never sent to any server.</p>
      </div>
    </div>
  );
};

export default PdfPasswordRemover;
