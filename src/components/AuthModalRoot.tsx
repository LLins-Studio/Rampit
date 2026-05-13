"use client";

import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";

export default function AuthModalRoot() {
  const { authOpen, setAuthOpen, setUser } = useAuth();
  return (
    <AuthModal
      open={authOpen}
      onSuccess={(email) => { setUser(email); setAuthOpen(false); }}
      onClose={() => setAuthOpen(false)}
    />
  );
}
