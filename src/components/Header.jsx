import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const headerRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header.style.padding = '8px 20px';
        header.style.width = 'calc(100% - 20px)';
      } else {
        header.style.padding = '12px 24px';
        header.style.width = 'calc(100% - 40px)';
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    if (targetId === '#') return;
    document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header ref={headerRef} id="main-header">
      <Link to="/" className="logo">
        <div className="logo-icon"><Zap size={16} /></div>
        Rampit
      </Link>
      <nav>
        <ul>
          <li><a href="#buy" onClick={(e) => handleNavClick(e, '#buy')}>Buy Crypto</a></li>
          <li><a href="#benefits" onClick={(e) => handleNavClick(e, '#benefits')}>Benefits</a></li>
          <li><a href="#features" onClick={(e) => handleNavClick(e, '#features')}>Features</a></li>
          <li><a href="#security" onClick={(e) => handleNavClick(e, '#security')}>Security</a></li>
          <li><a href="#faq" onClick={(e) => handleNavClick(e, '#faq')}>FAQ</a></li>
        </ul>
      </nav>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>Dashboard</Link>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>Sign out</button>
        </div>
      ) : (
        <a href="#buy" onClick={(e) => { e.preventDefault(); document.querySelector('#buy')?.scrollIntoView({ behavior: 'smooth' }); }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
          Get started
        </a>
      )}
    </header>
  );
}
