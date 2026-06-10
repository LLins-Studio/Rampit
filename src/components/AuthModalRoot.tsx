"use client";

import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";

export default function AuthModalRoot() {
  const { authOpen, setAuthOpen, setUser, setProfile } = useAuth();

  async function handleSuccess(email: string) {
    setUser(email);
    setAuthOpen(false);
    const token = localStorage.getItem("rampit_access_token");
    if (!token) return;
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => { if (res?.success && res.data) setProfile(res.data); })
      .catch(() => {});
  }

  return (
    <AuthModal
      open={authOpen}
      onSuccess={handleSuccess}
      onClose={() => setAuthOpen(false)}
    />
  );
}
