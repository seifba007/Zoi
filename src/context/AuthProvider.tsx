import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readValue, removeValue, storageKeys, writeValue } from "@/services/storage";

/**
 * Admin authentication.
 *
 * Demo credentials live here only because there is no backend yet. In
 * production `signIn` posts to your auth endpoint and stores the returned
 * token — the rest of the app (AdminRoute, useAuth) stays untouched.
 */

const DEMO_CREDENTIALS = { email: "admin@zoi.de", password: "zoi2026" };

type Session = { email: string; name: string; signedInAt: string };

type AuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  demoCredentials: typeof DEMO_CREDENTIALS;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(readValue<Session | null>(storageKeys.session, null));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Simulates the latency of a real auth round-trip
    await new Promise((resolve) => setTimeout(resolve, 500));

    const matches =
      email.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
    if (!matches) return false;

    const next: Session = {
      email: DEMO_CREDENTIALS.email,
      name: "Zoi Team",
      signedInAt: new Date().toISOString(),
    };
    setSession(next);
    writeValue(storageKeys.session, next);
    return true;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    removeValue(storageKeys.session);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      signIn,
      signOut,
      demoCredentials: DEMO_CREDENTIALS,
    }),
    [session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
};
