import { Link } from 'react-router-dom';
import { User, Mail, Phone, ShieldCheck, ShieldAlert, ShieldX, ChevronRight, ArrowLeftRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const TIER_INFO = {
  none:  { label: 'Unverified',    dailyLimit: '₦0',           txLimit: '₦0',       color: '#dc2626', icon: ShieldX },
  tier1: { label: 'Basic (BVN)',   dailyLimit: '₦50,000',      txLimit: '₦200,000', color: '#d97706', icon: ShieldAlert },
  tier2: { label: 'Standard (ID)', dailyLimit: '₦500,000',     txLimit: '₦200,000', color: '#008751', icon: ShieldCheck },
  tier3: { label: 'Enhanced',      dailyLimit: '₦5,000,000',   txLimit: '₦200,000', color: '#008751', icon: ShieldCheck },
};

export default function Account() {
  const { user } = useAuth();
  const kycStatus = user?.kycStatus || 'none';
  const tier = TIER_INFO[kycStatus] || TIER_INFO.none;
  const TierIcon = tier.icon;

  return (
    <DashboardLayout>
      <div className="dl-page">
        <div className="dl-page-header">
          <h2>Account</h2>
          <p>Your profile and account summary</p>
        </div>

        {/* Avatar + name */}
        <div className="account-hero">
          <div className="account-avatar">{user?.fullName?.[0]?.toUpperCase()}</div>
          <div>
            <div className="account-name">{user?.fullName}</div>
            <div className="account-since">Member since {new Date().getFullYear()}</div>
          </div>
        </div>

        {/* Profile details */}
        <div className="account-section">
          <div className="account-section-title">Profile</div>
          <div className="account-card">
            <div className="account-row">
              <div className="account-row-left">
                <User size={16} />
                <span>Full Name</span>
              </div>
              <strong>{user?.fullName}</strong>
            </div>
            <div className="account-row">
              <div className="account-row-left">
                <Mail size={16} />
                <span>Email</span>
              </div>
              <strong>{user?.email}</strong>
            </div>
            <div className="account-row">
              <div className="account-row-left">
                <Phone size={16} />
                <span>Phone</span>
              </div>
              <strong>{user?.phone || '—'}</strong>
            </div>
          </div>
        </div>

        {/* KYC status */}
        <div className="account-section">
          <div className="account-section-title">Verification</div>
          <div className="account-card">
            <div className="account-row">
              <div className="account-row-left">
                <TierIcon size={16} color={tier.color} />
                <span>KYC Status</span>
              </div>
              <strong style={{ color: tier.color }}>{tier.label}</strong>
            </div>
            <div className="account-row">
              <div className="account-row-left">
                <ArrowLeftRight size={16} />
                <span>Daily Limit</span>
              </div>
              <strong>{tier.dailyLimit}</strong>
            </div>
            <div className="account-row">
              <div className="account-row-left">
                <ArrowLeftRight size={16} />
                <span>Max per Transaction</span>
              </div>
              <strong>{tier.txLimit}</strong>
            </div>
            {kycStatus !== 'tier3' && (
              <Link to="/kyc" className="account-upgrade-btn">
                {kycStatus === 'none' ? 'Complete KYC to start buying' : 'Upgrade KYC for higher limits'}
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="account-section">
          <div className="account-section-title">Tier Limits</div>
          <div className="account-card">
            {Object.entries(TIER_INFO).map(([key, info]) => {
              const InfoIcon = info.icon;
              const isCurrent = key === kycStatus;
              return (
                <div key={key} className={`account-row ${isCurrent ? 'account-row--active' : ''}`}>
                  <div className="account-row-left">
                    <InfoIcon size={16} color={info.color} />
                    <span style={{ color: isCurrent ? info.color : undefined }}>{info.label}</span>
                    {isCurrent && <span className="account-current-badge">Current</span>}
                  </div>
                  <strong>{info.dailyLimit}/day</strong>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
