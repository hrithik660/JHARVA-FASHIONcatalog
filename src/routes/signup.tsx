import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/" }),
  head: () => ({ meta: [{ title: "Create account · Jharva Fashion" }] }),
  component: SignupPage,
});

const MAX_SIGNUP_ATTEMPTS = 3;
const SIGNUP_LOCKOUT_MS = 60_000;

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length < 6) return { label: "Too short", color: "bg-red-400", width: "w-1/6" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-400", width: "w-1/3" };
  if (score <= 2) return { label: "Fair", color: "bg-amber-400", width: "w-2/3" };
  return { label: "Strong", color: "bg-green-500", width: "w-full" };
}

function SignupPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const attemptsRef = useRef(0);

  const isLockedOut = Date.now() < lockoutUntil;
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      toast.error("Too many attempts. Please wait before trying again.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      attemptsRef.current++;
      if (attemptsRef.current >= MAX_SIGNUP_ATTEMPTS) {
        setLockoutUntil(Date.now() + SIGNUP_LOCKOUT_MS);
        attemptsRef.current = 0;
        toast.error("Too many attempts. Locked for 60 seconds.");
        setTimeout(() => setLockoutUntil(0), SIGNUP_LOCKOUT_MS);
      } else {
        toast.error(error.message);
      }
      return;
    }
    attemptsRef.current = 0;
    toast.success("Account created ✨");
    navigate({ to: redirect });
  };

  const onGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirect,
    });
    if (res.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-cocoa-deep px-4 py-10">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-luxe p-8 border border-gold/20">
        <Link to="/" className="block text-center mb-6">
          <span className="font-display text-gold text-3xl tracking-[0.22em]">JHARVA</span>
        </Link>
        <h1 className="font-display text-2xl text-center text-primary mb-1">Create your account</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">Join the Jharva family</p>

        <button
          onClick={onGoogle}
          type="button"
          className="w-full mb-4 flex items-center justify-center gap-2 border border-border rounded-full py-3 text-sm font-medium hover:bg-muted transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.5 6.6 28.9 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10.5 0 19-8.5 19-19 0-1.3-.1-2.3-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C33.5 6.6 28.9 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 43c4.8 0 9.2-1.6 12.6-4.3l-5.8-4.9C28.9 35.4 26.6 36 24 36c-5.3 0-9.7-2.5-11.3-7.1l-6.5 5C9.5 38.5 16.1 43 24 43z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.3-4.4 5.6l5.8 4.9C40.9 35.7 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Full name"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            autoComplete="new-password"
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none"
          />
          {strength && (
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
              </div>
              <p className={`text-[0.65rem] font-semibold ${strength.color === 'bg-green-500' ? 'text-green-600' : strength.color === 'bg-amber-400' ? 'text-amber-600' : 'text-red-500'}`}>
                {strength.label}
              </p>
            </div>
          )}
          <button
            disabled={loading || isLockedOut}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-cocoa-deep transition disabled:opacity-60"
          >
            {isLockedOut ? "Locked — wait 60s" : loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ redirect }}
            className="text-primary font-semibold hover:text-gold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
