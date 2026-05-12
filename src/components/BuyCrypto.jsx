import { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRates } from '../api';
import AuthModal from './AuthModal';

export default function BuyCrypto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ amount: '', token: 'USDT', chain: 'CELO' });
  const [rates, setRates] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const supportedTokens = [
    { value: 'USDT', label: 'USDT' },
    { value: 'USDC', label: 'USDC' },
  ];

  const supportedChains = [
    { value: 'CELO',   label: 'Celo' },
    { value: 'BASE',   label: 'Base' },
    { value: 'BNB',    label: 'BNB Smart Chain' },
    { value: 'SOLANA', label: 'Solana' },
  ];

  useEffect(() => {
    getRates(['USDT', 'USDC'])
      .then(setRates)
      .catch(() => setRates([
        { token: 'USDT', ngnRate: 1600, change24h: '+0.1%' },
        { token: 'USDC', ngnRate: 1598, change24h: '+0.05%' },
      ]));
  }, []);

  const currentRate = rates.find((r) => r.token === form.token)?.ngnRate || 1600;
  const tokenAmount = form.amount ? (parseFloat(form.amount) / currentRate).toFixed(6) : '';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) { setShowModal(true); return; }
    navigate('/dashboard', { state: { prefill: form } });
  };

  const handleAuthSuccess = () => {
    setShowModal(false);
    navigate('/dashboard', { state: { prefill: form } });
  };

  return (
    <section id="buy" style={{ background: 'var(--bg-alt)', padding: '48px 0 80px' }}>
      <div className="container">
        <div className="buy-section-layout">

          {/* Left: rates info */}
          <div className="buy-section-left" data-reveal>
            <p style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', marginBottom: 8 }}>Live Rates</p>
            <h2 style={{ textAlign: 'left', fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 16 }}>
              Naira to Crypto,<br />in seconds.
            </h2>
            <p style={{ marginBottom: 32 }}>
              Check live rates and buy USDT or USDC on any supported chain. No hidden fees, instant settlement.
            </p>
            <div className="rates-cards">
              {rates.map((r) => (
                <div className="rates-card" key={r.token}>
                  <div className="rates-card-token">{r.token}</div>
                  <div className="rates-card-rate">₦{Number(r.ngnRate).toLocaleString()}</div>
                  <div className="rates-card-change" style={{ color: r.change24h?.startsWith('+') ? 'var(--primary)' : '#dc2626' }}>
                    {r.change24h} 24h
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                <Wallet size={16} color="var(--primary)" /> Under 60s settlement
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                <TrendingUp size={16} color="var(--primary)" /> 1% flat fee
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="buy-section-right" data-reveal>
            <div className="buy-form-card">
              <h3 style={{ marginBottom: 4 }}>Get a Quote</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: 24 }}>No sign up needed to check rates</p>
              <form onSubmit={handleSubmit} className="dashboard-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Token</label>
                    <select name="token" value={form.token} onChange={handleChange}>
                      {supportedTokens.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Chain</label>
                    <select name="chain" value={form.chain} onChange={handleChange}>
                      {supportedChains.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Amount (NGN)</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="e.g. 10,000"
                    value={form.amount}
                    onChange={handleChange}
                    min="1000"
                    max="200000"
                    required
                  />
                  {tokenAmount && (
                    <div className="form-hint">
                      You'll receive ≈ <strong>{tokenAmount} {form.token}</strong> at ₦{currentRate.toLocaleString()}/{form.token}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary btn-full">
                  {user ? 'Continue to Buy' : 'Get Quote'} <ArrowRight size={16} />
                </button>
                {!user && (
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    You'll be asked to sign in when you proceed
                  </p>
                )}
              </form>
            </div>
          </div>

        </div>
      </div>
      {showModal && <AuthModal onClose={() => setShowModal(false)} onSuccess={handleAuthSuccess} />}
    </section>
  );
}
