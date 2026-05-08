import { useState } from 'react';
import { X, Zap } from 'lucide-react';

export default function DevBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="dev-banner">
      <div className="dev-banner-inner">
        <Zap size={14} className="dev-banner-icon" />
        <span>Rampit is currently under active development — some features may not be available yet. Stay tuned.</span>
      </div>
      <button className="dev-banner-close" onClick={() => setVisible(false)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
