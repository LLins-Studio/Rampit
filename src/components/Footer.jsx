import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 40 }}>
          <div style={{ maxWidth: 300 }}>
            <a href="#" className="logo" style={{ marginBottom: 20 }}>
              <div className="logo-icon"><Zap size={16} /></div>
              EaseCrypt
            </a>
            <p style={{ fontSize: '0.9375rem' }}>Building the future of finance for Nigeria and beyond. Fast, secure, and intelligent.</p>
          </div>
          <div style={{ display: 'flex', gap: 60 }}>
            <div>
              <h4 style={{ marginBottom: 20, fontSize: '1rem' }}>Platform</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Benefits</a></li>
                <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Features</a></li>
                <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Security</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: 20, fontSize: '1rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.875rem' }}>About Us</a></li>
                <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Contact</a></li>
                <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Privacy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          © 2026 EaseCrypt Technologies Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
