import { Star } from 'lucide-react';
import avatars from '../assets/images/avatars.png';
import hero from '../assets/images/hero.png';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container" data-reveal>
        <div className="social-proof">
          <div className="avatar-stack">
            {[0, -40, -80, -120].map((offset, i) => (
              <img key={i} src={avatars} alt="User" style={{ objectPosition: `${offset}px 0` }} />
            ))}
          </div>
          <div className="rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="gold" color="gold" />
              ))}
              <span className="rating-text">4.8</span>
            </div>
            <div className="downloads">500K+ Downloads</div>
          </div>
        </div>

        <h1>Seamlessly Move From <br /> Naira to Crypto.</h1>
        <p className="max-w-medium">
          Rampit combines bank transfers, instant settlements, and secure wallet management into one intelligent system for the Nigerian market.
        </p>

        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://apple.com" target="_blank" rel="noreferrer">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" style={{ height: 48 }} />
          </a>
          <a href="https://google.com" target="_blank" rel="noreferrer">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" style={{ height: 48 }} />
          </a>
        </div>

        <div className="hero-mockups">
          <img src={hero} alt="Rampit Mobile Mockups" />
        </div>
      </div>
    </section>
  );
}
