import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './style.css';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import KYC from './pages/KYC';
import Transactions from './pages/Transactions';
import Account from './pages/Account';

// Components
import DevBanner from './components/DevBanner';
import ProtectedRoute from './components/ProtectedRoute';

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
      <DevBanner />
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
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
