import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · Jharva Fashion" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-cocoa-deep px-4 py-10">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-luxe p-8 border border-gold/20">
        <Link to="/" className="block text-center mb-6">
          <span className="font-display text-gold text-3xl tracking-[0.22em]">JHARVA</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 grid place-items-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-primary mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-6">
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
              Check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              search={{ redirect: "/" }}
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-cocoa-deep transition"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl text-center text-primary mb-1">
              Reset your password
            </h1>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Enter your email and we'll send you a reset link
            </p>

            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none"
              />
              <button
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-cocoa-deep transition disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm mt-5 text-muted-foreground">
              Remember your password?{" "}
              <Link
                to="/login"
                search={{ redirect: "/" }}
                className="text-primary font-semibold hover:text-gold"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
