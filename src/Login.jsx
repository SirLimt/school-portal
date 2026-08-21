import React, { useState } from "react";
import crest from "./assets/crest.jpg";
import { useAuth } from "./AuthProvider";

const SCHOOL = "Young Executive School Complex";

const ROLE_OPTIONS = [
  { value: "teacher", label: "Teacher" },
  { value: "parent", label: "Parent" },
];

const shellClass = "min-h-screen flex items-center justify-center px-4";
const shellStyle = { background: "linear-gradient(160deg, #F5FAF6 0%, #EAF6ED 40%, #FFF7E6 100%)" };
const cardClass = "w-full max-w-sm bg-white border border-[#EDEEF5] rounded-xl shadow-lg overflow-hidden";
const inputClass = "w-full mt-1 bg-transparent border-b border-[#E5E7F0] focus:outline-none focus:border-[#0B6B2B] py-1.5 text-[#1F2937]";

function Header({ title }) {
  return (
    <div className="relative px-6 py-6 text-center overflow-hidden" style={{ background: "linear-gradient(135deg, #0B6B2B, #064420)" }}>
      <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-20 rounded-full" style={{ background: "#E3A400", opacity: 0.2, filter: "blur(16px)" }} />
      <img src={crest} alt={`${SCHOOL} crest`} className="relative mx-auto mb-2 h-16 w-16 rounded-full object-cover ring-4 ring-white/20" />
      <p className="relative text-[11px] uppercase tracking-[0.25em] text-[#D9F2C4]">{SCHOOL}</p>
      <h1 className="relative text-lg font-semibold text-white mt-1">{title}</h1>
    </div>
  );
}

function ForgotPasswordForm({ onBack }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await resetPassword(email);
    setBusy(false);
    setStatus(
      error ? { ok: false, message: error.message } : { ok: true, message: "Check your email for a reset link." }
    );
  };

  return (
    <div className={shellClass} style={{ ...shellStyle, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div className={cardClass}>
        <Header title="Reset your password" />
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-xs text-[#6B7280]">
            This only works for staff and parent accounts (which use email). Students should ask an admin to reset
            their password directly, since registration-number accounts don't have a real email on file.
          </p>
          <div>
            <label className="text-xs uppercase tracking-wide text-[#6B7280]">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          {status && <p className={`text-sm ${status.ok ? "text-[#0B6B2B]" : "text-[#DC2626]"}`}>{status.message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#0B6B2B] text-[#FFFFFF] py-2 rounded-sm text-sm hover:bg-[#084F20] disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <button type="button" onClick={onBack} className="w-full text-center text-xs text-[#6B7280] hover:text-[#DC2626]">
            Back to sign in
          </button>
        </form>
      </div>
    </div>
  );
}

export function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ ok: false, message: "Passwords don't match." });
      return;
    }
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) setStatus({ ok: false, message: error.message });
  };

  return (
    <div className={shellClass} style={{ ...shellStyle, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <div className={cardClass}>
        <Header title="Choose a new password" />
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-[#6B7280]">New password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[#6B7280]">Confirm password</label>
            <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          {status && <p className="text-sm text-[#DC2626]">{status.message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#0B6B2B] text-[#FFFFFF] py-2 rounded-sm text-sm hover:bg-[#084F20] disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const { signIn, signUp, signInWithRegistrationCode, signUpWithRegistrationCode } = useAuth();
  const [audience, setAudience] = useState("student"); // "student" | "staff"
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"

  const [email, setEmail] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("teacher");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (mode === "forgot") return <ForgotPasswordForm onBack={() => setMode("signin")} />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    let result;
    if (audience === "student") {
      result =
        mode === "signin"
          ? await signInWithRegistrationCode({ regNumber, password })
          : await signUpWithRegistrationCode({ regNumber, password, fullName });
    } else {
      result =
        mode === "signin"
          ? await signIn({ email, password })
          : await signUp({ email, password, fullName, role });
    }

    setBusy(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (mode === "signup") {
      if (audience === "staff") {
        setNotice("Account created — check your email to confirm, then sign in.");
      } else {
        setNotice("Account created — you can sign in now.");
      }
      setMode("signin");
    }
  };

  return (
    <div className={shellClass} style={{ ...shellStyle, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <div className={cardClass}>
        <Header title={mode === "signin" ? "Sign in" : "Create account"} />

        <div className="flex border-b border-[#E7E9F3]">
          {[
            { key: "student", label: "Student" },
            { key: "staff", label: "Staff / Parent" },
          ].map((a) => (
            <button
              key={a.key}
              onClick={() => {
                setAudience(a.key);
                setError("");
                setNotice("");
              }}
              className={`flex-1 text-sm py-2 ${
                audience === a.key ? "bg-[#F5FAF6] text-[#1F2937] font-medium" : "text-[#6B7280]"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs uppercase tracking-wide text-[#6B7280]">Full name</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
          )}

          {audience === "student" ? (
            <div>
              <label className="text-xs uppercase tracking-wide text-[#6B7280]">Registration number</label>
              <input required value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className={inputClass} />
              {mode === "signup" && (
                <p className="text-xs text-[#6B7280] mt-1">
                  Use the registration number issued to you by the school office.
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs uppercase tracking-wide text-[#6B7280]">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-wide text-[#6B7280]">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>

          {mode === "signup" && audience === "staff" && (
            <div>
              <label className="text-xs uppercase tracking-wide text-[#6B7280]">I am a</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-[#DC2626]">{error}</p>}
          {notice && <p className="text-sm text-[#0B6B2B]">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#0B6B2B] text-[#FFFFFF] py-2 rounded-sm text-sm hover:bg-[#084F20] disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {mode === "signin" && audience === "staff" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="w-full text-center text-xs text-[#6B7280] hover:text-[#DC2626]"
            >
              Forgot your password?
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            className="w-full text-center text-xs text-[#6B7280] hover:text-[#DC2626]"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
