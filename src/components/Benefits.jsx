import chat from '../assets/images/chat.png';
import hero from '../assets/images/hero.png';

const benefits = [
  {
    badge: 'AI-Powered',
    title: 'Instant Transaction Priority',
    desc: 'Our system automatically surfaces what matters most based on market volatility and clearing times.',
    img: chat,
    alt: 'Priority Mockup',
  },
  {
    badge: 'Seamless',
    title: 'Unified History Timeline',
    desc: 'Your bank transfers and crypto receipts live together in one clean, searchable timeline.',
    img: hero,
    alt: 'Unified Timeline Mockup',
  },
];

export default function Benefits() {
  return (
    <section className="benefits-split">
      <div className="container" data-reveal>
        <p className="text-center" style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Key Benefits</p>
        <h2 className="text-center">Smarter Wallet Management</h2>
        <div className="benefits-list">
          {benefits.map(({ badge, title, desc, img, alt }) => (
            <div className="benefit-card" key={title}>
              <div className="benefit-content">
                <div className="badge">{badge}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <div className="benefit-visual">
                <img src={img} alt={alt} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
