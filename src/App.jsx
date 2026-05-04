import './style.css';
import useScrollReveal from './hooks/useScrollReveal';
import Header from './components/Header';
import Hero from './components/Hero';
import Challenge from './components/Challenge';
import HyperAutomation from './components/HyperAutomation';
import Features from './components/Features';
import Benefits from './components/Benefits';
import Footer from './components/Footer';

export default function App() {
  useScrollReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Challenge />
        <HyperAutomation />
        <Features />
        <Benefits />
      </main>
      <Footer />
    </>
  );
}
