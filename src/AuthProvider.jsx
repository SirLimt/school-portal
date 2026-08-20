import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Registration-number accounts (mainly students) don't have a real email,
// so we quietly turn their number into an internal address behind the
// scenes — e.g. "12345" becomes "12345@yescomplexkda.local". The person
// never sees or types this; they only ever use their registration number.
const REG_EMAIL_DOMAIN = "yescomplexkda-students.com";
const regNumberToEmail = (regNumber) => `${regNumber.trim().toLowerCase()}@${REG_EMAIL_DOMAIN}`;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error("Failed to load profile:", error.message);
        setProfile(data ?? null);
      });
  }, [session]);

  const signUp = async ({ email, password, fullName, role }) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
  };

  const signIn = async ({ email, password }) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  // Student sign-up: checks the registration number is valid and unused,
  // reserves it, then creates the account. If account creation fails after
  // the number was reserved, the number is released so it can be tried again.
  const signUpWithRegistrationCode = async ({ regNumber, password, fullName }) => {
    const { data: claimed, error: claimError } = await supabase.rpc("claim_registration_code", {
      p_code: regNumber.trim(),
    });
    if (claimError) return { error: claimError };
    if (!claimed) {
      return { error: { message: "That registration number isn't valid or has already been used." } };
    }

    const result = await supabase.auth.signUp({
      email: regNumberToEmail(regNumber),
      password,
      options: { data: { full_name: fullName, role: "student", reg_number: regNumber.trim() } },
    });

    if (result.error) {
      await supabase.rpc("release_registration_code", { p_code: regNumber.trim() });
    }
    return result;
  };

  const signInWithRegistrationCode = async ({ regNumber, password }) => {
    return supabase.auth.signInWithPassword({ email: regNumberToEmail(regNumber), password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
  };

  const updatePassword = async (newPassword) => {
    const result = await supabase.auth.updateUser({ password: newPassword });
    if (!result.error) setRecoveryMode(false);
    return result;
  };

  const loading = session === undefined || (session && profile === null);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        recoveryMode,
        signUpWithRegistrationCode,
        signInWithRegistrationCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
