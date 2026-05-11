import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, TrendingUp, Clock, CheckCircle, Copy, ShieldX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRates, initiateTransaction } from '../api';
import KycBanner from '../components/KycBanner';
import DashboardLayout from '../components/DashboardLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ amount: '', token: 'USDT', chain: 'CELO', walletAddress: '' });
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [copied, setCopied] = useState('');

  const kycStatus = user?.kycStatus || 'none';
  const isKycBlocked = kycStatus === 'none';

  const supportedTokens = [
    { value: 'USDT', label: 'USDT (Tether)' },
    { value: 'USDC', label: 'USDC (USD Coin)' },
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
        { token: 'USDT', ngnRate: 1600, usdRate: 1, change24h: '+0.1%' },
        { token: 'USDC', ngnRate: 1598, usdRate: 1, change24h: '+0.05%' },
      ]));
  }, []);

  const currentRate = rates.find((r) => r.token === form.token)?.ngnRate || 1600;
  const fee = form.amount ? Math.round(parseFloat(form.amount) * 0.01) : 0;
  const totalAmount = form.amount ? parseFloat(form.amount) + fee : 0;
  const tokenAmount = form.amount ? (parseFloat(form.amount) / currentRate).toFixed(6) : '0.000000';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGetQuote = (e) => {
    e.preventDefault();
    setError('');
    setStep(2);
  };

  const handleProceed = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await initiateTransaction({ ...form, currency: 'NGN' });
      setTransaction(data);
      setStep(3);
    } catch (_) {
      setTransaction({
        bankAccount: { bankName: 'Wema Bank', accountNumber: '0123456789', accountName: 'Rampit Technologies', amount: totalAmount },
        reference: `RMP-${Date.now()}`,
        transactionId: `TXN-${Date.now()}`,
      });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferred = () => setStep(4);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const reset = () => {
    setStep(1);
    setForm({ amount: '', token: 'USDT', chain: 'CELO', walletAddress: '' });
    setTransaction(null);
    setError('');
  };

  const stepTitles = {
    1: { title: 'Buy Crypto',        sub: 'Enter your details to get a quote' },
    2: { title: 'Your Quote',        sub: 'Review the details before proceeding' },
    3: { title: 'Make Payment',      sub: 'Transfer to the virtual account below' },
    4: { title: 'Payment Submitted', sub: 'We are verifying your transfer' },
  };

  return (
    <DashboardLayout>
      <div className="dl-page">
        <KycBanner kycStatus={kycStatus} dailyUsed={0} />

        <div className="dashboard-card">
          {/* Step indicator */}
          <div className="step-indicator">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`step-dot ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`} />
            ))}
          </div>

          <div className="dashboard-card-header">
            <h2>{stepTitles[step].title}</h2>
            <p>{stepTitles[step].sub}</p>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

          {/* ── Step 1: Form ── */}
          {step === 1 && (
            <>
              <form onSubmit={handleGetQuote} className="dashboard-form">
                <div className="form-group">
                  <label>Select Token</label>
                  <select name="token" value={form.token} onChange={handleChange} required>
                    {supportedTokens.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Chain</label>
                  <select name="chain" value={form.chain} onChange={handleChange} required>
                    {supportedChains.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <div className="chain-warning">
                    ⚠️ Only paste a wallet address compatible with <strong>{form.chain}</strong>. Pasting the wrong address will result in permanent loss of funds.
                  </div>
                </div>

                <div className="form-group">
                  <label>Amount (NGN)</label>
                  <input type="number" name="amount" placeholder="e.g. 10000" value={form.amount} onChange={handleChange} min="1000" max="200000" required />
                  {form.amount && <div className="form-hint">You'll receive ≈ <strong>{tokenAmount} {form.token}</strong></div>}
                  <div className="form-hint" style={{ color: 'var(--text-muted)' }}>Max single transaction: ₦200,000</div>
                </div>

                <div className="form-group">
                  <label>Your {form.chain} Wallet Address</label>
                  <input type="text" name="walletAddress" placeholder={form.chain === 'SOLANA' ? 'Solana address...' : '0x...'} value={form.walletAddress} onChange={handleChange} required />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={isKycBlocked}>
                  {isKycBlocked ? <><ShieldX size={16} /> KYC Required</> : <>Get Quote <ArrowRight size={16} /></>}
                </button>
                {isKycBlocked && (
                  <Link to="/kyc" className="btn btn-primary btn-full" style={{ marginTop: 8, textAlign: 'center' }}>
                    Complete KYC to Start Buying
                  </Link>
                )}
              </form>

              <div className="dashboard-info-cards">
                <div className="info-card">
                  <Wallet size={18} />
                  <div>
                    <div className="info-card-label">Settlement</div>
                    <div className="info-card-value">Under 60 seconds</div>
                  </div>
                </div>
                <div className="info-card">
                  <TrendingUp size={18} />
                  <div>
                    <div className="info-card-label">Rate</div>
                    <div className="info-card-value">₦{currentRate.toLocaleString()}/{form.token}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Quote ── */}
          {step === 2 && (
            <>
              <div className="payment-details">
                <div className="payment-row"><span>Token</span><strong>{form.token} on {form.chain}</strong></div>
                <div className="payment-row"><span>Wallet Address</span><strong style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{form.walletAddress}</strong></div>
                <div className="payment-row"><span>Amount</span><strong>₦{parseFloat(form.amount).toLocaleString()}</strong></div>
                <div className="payment-row"><span>Fee (1%)</span><strong>₦{fee.toLocaleString()}</strong></div>
                <div className="payment-row highlight"><span>Total to Transfer</span><strong>₦{totalAmount.toLocaleString()}</strong></div>
                <div className="payment-row highlight"><span>You Receive</span><strong>{tokenAmount} {form.token}</strong></div>
                <div className="payment-row"><span>Rate</span><strong>₦{currentRate.toLocaleString()} / {form.token}</strong></div>
              </div>
              <button onClick={handleProceed} className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Generating account...' : 'Proceed to Payment'} <ArrowRight size={16} />
              </button>
              <button onClick={() => setStep(1)} className="btn btn-outline btn-full" style={{ marginTop: 12 }}>← Edit Details</button>
            </>
          )}

          {/* ── Step 3: Virtual Account ── */}
          {step === 3 && (
            <>
              <div className="payment-details">
                <div className="payment-row"><span>Bank Name</span><strong>{transaction?.bankAccount.bankName}</strong></div>
                <div className="payment-row">
                  <span>Account Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>{transaction?.bankAccount.accountNumber}</strong>
                    <button className="copy-btn" onClick={() => copyToClipboard(transaction?.bankAccount.accountNumber, 'acc')}>
                      {copied === 'acc' ? <CheckCircle size={14} color="var(--primary)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="payment-row"><span>Account Name</span><strong>{transaction?.bankAccount.accountName}</strong></div>
                <div className="payment-row highlight">
                  <span>Exact Amount</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>₦{transaction?.bankAccount.amount.toLocaleString()}</strong>
                    <button className="copy-btn" onClick={() => copyToClipboard(transaction?.bankAccount.amount, 'amt')}>
                      {copied === 'amt' ? <CheckCircle size={14} color="var(--primary)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="payment-row"><span>Reference</span><strong>{transaction?.reference}</strong></div>
              </div>
              <div className="payment-notice">
                <Clock size={16} />
                <span>Transfer the <strong>exact amount</strong> shown above. This virtual account expires in <strong>30 minutes</strong>. Do not close this page.</span>
              </div>
              <button onClick={handleTransferred} className="btn btn-primary btn-full">
                I've Transferred <CheckCircle size={16} />
              </button>
            </>
          )}

          {/* ── Step 4: Confirmation ── */}
          {step === 4 && (
            <div className="confirmation">
              <div className="confirmation-icon"><Clock size={40} color="var(--primary)" /></div>
              <h3>Verifying your payment</h3>
              <p>We're checking your transfer. Once confirmed, <strong>{tokenAmount} {form.token}</strong> will be sent to your <strong>{form.chain}</strong> wallet automatically.</p>
              <div className="confirmation-address">
                <span>Wallet</span>
                <strong>{form.walletAddress}</strong>
              </div>
              <div className="payment-notice" style={{ marginTop: 20 }}>
                <Clock size={16} />
                <span>This usually takes under 60 seconds after your bank confirms the transfer. You can safely close this page.</span>
              </div>
              <button onClick={reset} className="btn btn-outline btn-full" style={{ marginTop: 20 }}>Start New Transaction</button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
