import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, ArrowLeftRight, User, ShoppingCart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: ShoppingCart, label: 'Buy Crypto' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/account', icon: User, label: 'Account' },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dl-root">
      {/* Sidebar */}
      <aside className="dl-sidebar">
        <Link to="/" className="logo dl-logo">
          <div className="logo-icon"><Zap size={16} /></div>
          Rampit
        </Link>

        <nav className="dl-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`dl-nav-item ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="dl-sidebar-footer">
          <div className="dl-user">
            <div className="dl-user-avatar">{user?.fullName?.[0]?.toUpperCase()}</div>
            <div className="dl-user-info">
              <div className="dl-user-name">{user?.fullName}</div>
              <div className="dl-user-email">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="dl-logout">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="dl-mobile-header">
        <Link to="/" className="logo">
          <div className="logo-icon"><Zap size={16} /></div>
          Rampit
        </Link>
        <div className="dl-mobile-nav">
          {navItems.map(({ path, icon: Icon }) => (
            <Link key={path} to={path} className={`dl-mobile-nav-item ${location.pathname === path ? 'active' : ''}`}>
              <Icon size={20} />
            </Link>
          ))}
          <button onClick={handleLogout} className="dl-mobile-nav-item">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="dl-main">
        {children}
      </main>
    </div>
  );
}
