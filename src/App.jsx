import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './style.css';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Landing page sections
import useScrollReveal from './hooks/useScrollReveal';
import Header from './components/Header';
import Hero from './components/Hero';
import Challenge from './components/Challenge';
import HyperAutomation from './components/HyperAutomation';
import Features from './components/Features';
import Benefits from './components/Benefits';
import Footer from './components/Footer';

function Landing() {
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
