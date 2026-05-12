import { Star } from 'lucide-react';
import avatars from '../assets/images/avatars.png';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container" data-reveal>
        <h1>Seamlessly Move From <br /> Naira to Crypto.</h1>
        <p className="max-w-medium">
          Rampit combines bank transfers, instant settlements, and secure wallet management into one intelligent system for the Nigerian market.
        </p>
      </div>
    </section>
  );
}
