import { Sparkles, Calendar, BarChart2, Clock, Tag, Users } from 'lucide-react';
import chat from '../assets/images/chat.png';

const leftFeatures = [
  { icon: <Sparkles size={18} />, title: 'Smart Capture', desc: 'Turn quick thoughts into structured tasks instantly.' },
  { icon: <Calendar size={18} />, title: 'AI Scheduling', desc: 'Rampit suggests the best time to complete tasks.' },
  { icon: <BarChart2 size={18} />, title: 'Intelligent Insights', desc: 'See productivity trends and improve over time.' },
];

const rightFeatures = [
  { icon: <Clock size={18} />, title: 'AI Reminders', desc: 'Never miss a deadline. They adapt to your schedule.' },
  { icon: <Tag size={18} />, title: 'Smart Tagging', desc: 'Tasks organize themselves automatically with smart tagging.' },
  { icon: <Users size={18} />, title: 'Smart Views', desc: 'Focus on what matters today, this week, or next.' },
];

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="feature-item-small">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="features-comprehensive">
      <div className="container" data-reveal>
        <p className="text-center" style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 8, fontSize: '0.9rem', letterSpacing: '0.05em' }}>Features</p>
        <h2 className="text-center" style={{ fontWeight: 500, color: '#555', maxWidth: 800, margin: '0 auto 60px' }}>
          Built for human thinking. <br />
          <span style={{ fontWeight: 800, color: '#000' }}>Automated Intelligently.</span>
        </h2>

        <div className="features-comprehensive-layout">
          <div className="feature-col">
            {leftFeatures.map((f) => <FeatureItem key={f.title} {...f} />)}
          </div>
          <div className="feature-phone-center">
            <img src={chat} alt="Rampit AI Assistant Mockup" />
          </div>
          <div className="feature-col">
            {rightFeatures.map((f) => <FeatureItem key={f.title} {...f} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
