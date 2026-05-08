import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { forgotPassword } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: 32 }}>
          <div className="logo-icon"><Zap size={16} /></div>
          Rampit
        </Link>

        {sent ? (
          <>
            <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: 8 }}>Check your email</h2>
            <p style={{ textAlign: 'center', marginBottom: 32, fontSize: '1rem' }}>
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login" className="btn btn-primary btn-full" style={{ textAlign: 'center' }}>Back to sign in</Link>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: 8 }}>Forgot password?</h2>
            <p style={{ textAlign: 'center', marginBottom: 32, fontSize: '1rem' }}>Enter your email and we'll send you a reset link</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="auth-footer-text">
              <Link to="/login">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
