import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ShieldX, ChevronRight } from 'lucide-react';

const TIERS = {
  none:     { label: 'Unverified',      limit: 0,         color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: ShieldX },
  tier1:    { label: 'Basic (BVN)',     limit: 50000,     color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: ShieldAlert },
  tier2:    { label: 'Standard (ID)',   limit: 500000,    color: '#008751', bg: '#e6f3ed', border: '#6ee7b7', icon: ShieldCheck },
  tier3:    { label: 'Enhanced',        limit: 5000000,   color: '#008751', bg: '#e6f3ed', border: '#6ee7b7', icon: ShieldCheck },
};

export default function KycBanner({ kycStatus = 'none', dailyUsed = 0 }) {
  const tier = TIERS[kycStatus] || TIERS.none;
  const Icon = tier.icon;
  const isMaxTier = kycStatus === 'tier3';
  const limitText = tier.limit === 0 ? 'No transactions allowed' : `₦${tier.limit.toLocaleString()}/day`;
  const usedPercent = tier.limit ? Math.min((dailyUsed / tier.limit) * 100, 100) : 0;

  return (
    <div className="kyc-banner" style={{ background: tier.bg, borderColor: tier.border }}>
      <div className="kyc-banner-left">
        <Icon size={20} color={tier.color} />
        <div>
          <div className="kyc-banner-title" style={{ color: tier.color }}>
            KYC: {tier.label}
          </div>
          <div className="kyc-banner-sub">
            Daily limit: {limitText}
            {tier.limit && ` · ₦${dailyUsed.toLocaleString()} used`}
          </div>
          {tier.limit && (
            <div className="kyc-progress-bar">
              <div className="kyc-progress-fill" style={{ width: `${usedPercent}%`, background: tier.color }} />
            </div>
          )}
        </div>
      </div>
      {!isMaxTier && (
        <Link to="/kyc" className="kyc-banner-cta" style={{ color: tier.color, borderColor: tier.border }}>
          {kycStatus === 'none' ? 'Verify Now' : 'Upgrade'} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
