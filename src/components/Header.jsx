import { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';

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

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    if (targetId === '#') return;
    document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header ref={headerRef} id="main-header">
      <a href="#" className="logo">
        <div className="logo-icon"><Zap size={16} /></div>
        EaseCrypt
      </a>
      <nav>
        <ul>
          <li><a href="#benefits" onClick={(e) => handleNavClick(e, '#benefits')}>Benefits</a></li>
          <li><a href="#features" onClick={(e) => handleNavClick(e, '#features')}>Features</a></li>
          <li><a href="#security" onClick={(e) => handleNavClick(e, '#security')}>Security</a></li>
          <li><a href="#faq" onClick={(e) => handleNavClick(e, '#faq')}>FAQ</a></li>
        </ul>
      </nav>
      <a href="#" className="btn btn-primary">Get the app</a>
    </header>
  );
}
