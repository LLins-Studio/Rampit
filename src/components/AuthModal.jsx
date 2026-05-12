import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        const { confirmPassword, ...payload } = form;
        await register(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>

        <div className="logo" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="logo-icon"><Zap size={16} /></div>
          Rampit
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: 6 }}>
          {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
        </h2>
        <p style={{ textAlign: 'center', marginBottom: 24, fontSize: '0.9rem' }}>
          {mode === 'login' ? "You need an account to execute transactions." : 'Join Rampit to start buying crypto with Naira.'}
        </p>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label>Full name</label>
              <input type="text" name="fullName" placeholder="John Doe" value={form.fullName} onChange={handleChange} required />
            </div>
          )}
          <div className="form-group">
            <label>Email address</label>
            <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label>Phone number</label>
              <input type="tel" name="phone" placeholder="+234 800 000 0000" value={form.phone} onChange={handleChange} required />
            </div>
          )}
          <div className="form-group">
            <label>
              Password
              {mode === 'login' && (
                <Link to="/forgot-password" className="form-label-link" onClick={onClose}>Forgot password?</Link>
              )}
            </label>
            <div className="input-icon-wrap">
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} minLength={8} required />
              <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label>Confirm password</label>
              <input type="password" name="confirmPassword" placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <p className="auth-footer-text" style={{ marginTop: 16 }}>
          {mode === 'login' ? (
            <>Don't have an account? <button className="modal-switch-btn" onClick={() => { setMode('register'); setError(''); }}>Create one</button></>
          ) : (
            <>Already have an account? <button className="modal-switch-btn" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
