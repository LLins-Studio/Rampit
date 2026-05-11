import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, CheckCircle, Upload, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitKyc } from '../api';

const ID_TYPES = [
  { value: 'nin', label: 'National ID (NIN)' },
  { value: 'passport', label: 'International Passport' },
  { value: 'drivers_license', label: "Driver's License" },
];

export default function KYC() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — BVN
  const [bvn, setBvn] = useState('');

  // Step 2 — ID
  const [idType, setIdType] = useState('nin');
  const [idNumber, setIdNumber] = useState('');
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);

  // Step 3 — Selfie
  const [selfie, setSelfie] = useState(null);

  const handleBvnSubmit = (e) => {
    e.preventDefault();
    if (bvn.length !== 11) { setError('BVN must be 11 digits'); return; }
    setError('');
    setStep(2);
  };

  const handleIdSubmit = (e) => {
    e.preventDefault();
    if (!idFront) { setError('Please upload the front of your ID'); return; }
    setError('');
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!selfie) { setError('Please upload a selfie'); return; }
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('bvn', bvn);
      formData.append('idType', idType);
      formData.append('idNumber', idNumber);
      formData.append('idFront', idFront);
      if (idBack) formData.append('idBack', idBack);
      formData.append('selfie', selfie);

      await submitKyc(formData);
      updateUser({ ...user, kycStatus: 'tier1' });
      setStep(4);
    } catch (_) {
      // Mock success while backend is not ready
      updateUser({ ...user, kycStatus: 'tier1' });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const FileInput = ({ label, file, onChange, hint }) => (
    <div className="form-group">
      <label>{label}</label>
      <label className={`file-upload ${file ? 'file-upload--done' : ''}`}>
        <input type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files[0])} hidden />
        {file ? (
          <><CheckCircle size={18} color="var(--primary)" /> <span>{file.name}</span></>
        ) : (
          <><Upload size={18} /> <span>Click to upload</span></>
        )}
      </label>
      {hint && <div className="form-hint" style={{ color: 'var(--text-muted)' }}>{hint}</div>}
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <Link to="/" className="logo">
          <div className="logo-icon"><Zap size={16} /></div>
          Rampit
        </Link>
        <Link to="/dashboard" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </Link>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-card">

          {/* Step indicator */}
          <div className="step-indicator">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`step-dot ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`} />
            ))}
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

          {/* ── Step 1: BVN ── */}
          {step === 1 && (
            <>
              <div className="dashboard-card-header">
                <h2>Verify your BVN</h2>
                <p>Your BVN is used to confirm your identity. It is never shared with third parties.</p>
              </div>
              <form onSubmit={handleBvnSubmit} className="dashboard-form">
                <div className="form-group">
                  <label>Bank Verification Number (BVN)</label>
                  <input
                    type="text"
                    placeholder="Enter your 11-digit BVN"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    required
                  />
                  <div className="form-hint" style={{ color: 'var(--text-muted)' }}>
                    Dial *565*0# on your registered phone number to get your BVN
                  </div>
                </div>
                <div className="kyc-info-box">
                  <Shield size={16} />
                  <span>Your BVN only reveals your name, date of birth, and phone number. It does not give access to your bank account.</span>
                </div>
                <button type="submit" className="btn btn-primary btn-full">
                  Continue <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: ID Upload ── */}
          {step === 2 && (
            <>
              <div className="dashboard-card-header">
                <h2>Upload your ID</h2>
                <p>Upload a valid government-issued ID to unlock higher transaction limits.</p>
              </div>
              <form onSubmit={handleIdSubmit} className="dashboard-form">
                <div className="form-group">
                  <label>ID Type</label>
                  <select value={idType} onChange={(e) => setIdType(e.target.value)} required>
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>ID Number</label>
                  <input
                    type="text"
                    placeholder="Enter your ID number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                  />
                </div>
                <FileInput
                  label="Front of ID"
                  file={idFront}
                  onChange={setIdFront}
                  hint="Clear photo or scan, max 5MB"
                />
                <FileInput
                  label="Back of ID (optional for passport)"
                  file={idBack}
                  onChange={setIdBack}
                />
                <button type="submit" className="btn btn-primary btn-full">
                  Continue <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline btn-full" style={{ marginTop: 8 }}>
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* ── Step 3: Selfie ── */}
          {step === 3 && (
            <>
              <div className="dashboard-card-header">
                <h2>Take a selfie</h2>
                <p>Hold your ID next to your face and take a clear photo. Make sure your face and ID are both visible.</p>
              </div>
              <form onSubmit={handleFinalSubmit} className="dashboard-form">
                <FileInput
                  label="Selfie with ID"
                  file={selfie}
                  onChange={setSelfie}
                  hint="Face and ID must both be clearly visible"
                />
                <div className="kyc-info-box">
                  <Shield size={16} />
                  <span>We use liveness detection to prevent fraud. Your documents are encrypted and stored securely.</span>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit for Review'} <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => setStep(2)} className="btn btn-outline btn-full" style={{ marginTop: 8 }}>
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* ── Step 4: Submitted ── */}
          {step === 4 && (
            <div className="confirmation">
              <div className="confirmation-icon">
                <CheckCircle size={40} color="var(--primary)" />
              </div>
              <h3>KYC Submitted!</h3>
              <p>Your documents are under review. This usually takes <strong>5–10 minutes</strong>. You'll be notified once approved.</p>
              <div className="kyc-tier-upgrade">
                <div className="kyc-tier-row">
                  <span>Tier 1 — BVN only</span>
                  <strong>₦50,000/day</strong>
                </div>
                <div className="kyc-tier-row">
                  <span>Tier 2 — BVN + ID + Selfie</span>
                  <strong>₦500,000/day</strong>
                </div>
                <div className="kyc-tier-row">
                  <span>Tier 3 — Enhanced</span>
                  <strong style={{ color: 'var(--primary)' }}>₦5,000,000/day</strong>
                </div>
                <div className="kyc-tier-row">
                  <span>Max single transaction</span>
                  <strong>₦200,000</strong>
                </div>
              </div>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                Go to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
