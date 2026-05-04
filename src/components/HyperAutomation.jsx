import { Zap, Landmark, ShieldCheck } from 'lucide-react';

const cards = [
  {
    icon: <Zap size={32} />,
    title: 'Instant Fulfillment',
    desc: 'Our automated engine verifies your bank transfer and releases tokens to your wallet in under 60 seconds.',
  },
  {
    icon: <Landmark size={32} />,
    title: 'Direct Bank Sync',
    desc: 'No more manual proof of payments. Our system syncs directly with all major Nigerian banks for instant confirmation.',
  },
  {
    icon: <ShieldCheck size={32} />,
    title: 'On-Site security',
    desc: 'Fast, private intelligence that works in real time. We never hold your keys or your funds longer than needed.',
  },
];

export default function HyperAutomation() {
  return (
    <section id="benefits" className="hyper-automation">
      <div className="container" data-reveal>
        <p className="text-center" style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Intelligence Powered</p>
        <h2 className="text-center">Hyper-automation for human focus.</h2>
        <div className="features-grid">
          {cards.map(({ icon, title, desc }) => (
            <div className="card" key={title}>
              <div className="icon" style={{ color: 'var(--primary)', marginBottom: 20 }}>{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
