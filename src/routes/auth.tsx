import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackPixel, trackPixelCustom } from "@/lib/meta-pixel";
import { readBirthDraft, trackFunnel } from "@/lib/birth-draft";

export const Route = createFileRoute("/auth")({
  head: () => ({

    meta: [
      { title: "Sign in — Aether" },
      { name: "description", content: "Get your readings. Sign in or create an Aether account." },
      { property: "og:title", content: "Sign in — Aether" },
      { property: "og:description", content: "Get your readings." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aetherhoroscope.com/auth" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://aetherhoroscope.com/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [hasDraft, setHasDraft] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const needsConsent = mode === "signup" && !agreed;

  useEffect(() => {
    const draft = readBirthDraft();
    if (draft) {
      setHasDraft(true);
      setMode("signup");
    }
    trackFunnel("AuthViewed", { with_chart: !!draft });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (needsConsent) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: {
              terms_accepted_at: new Date().toISOString(),
              marketing_opt_in: marketing,
            },
          },
        });
        if (error) throw error;
        trackPixel("CompleteRegistration", { method: "email" });
        trackFunnel("AuthCompleted", { method: "email" });
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        trackPixelCustom("SignIn", { method: "email" });
        trackFunnel("AuthCompleted", { method: "email_signin" });
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    setError(null);
    if (needsConsent) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setGoogleBusy(true);
    if (mode === "signup") {
      try {
        window.localStorage.setItem(
          "aether_signup_consent",
          JSON.stringify({
            terms_accepted_at: new Date().toISOString(),
            marketing_opt_in: marketing,
          }),
        );
      } catch {
        /* storage unavailable — consent still recorded by the checkbox gate */
      }
    }
    trackPixelCustom(mode === "signup" ? "SignUpStarted" : "SignInStarted", { method: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error.message);
      setGoogleBusy(false);
    }
  }


  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link to="/" className="text-xl font-serif italic tracking-widest text-gilded">
          AETHER
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
            {hasDraft ? "Step two of two" : mode === "signin" ? "Return" : "Begin"}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-light italic mb-6">
            {hasDraft
              ? "Your chart is ready."
              : mode === "signin"
                ? "Get your readings."
                : "Open an account."}
          </h1>
          {hasDraft ? (
            <p className="text-sm text-stone-400 mb-8">
              Create an account to open it — your birth details are already saved, so there's
              nothing to retype. 100% private &amp; encrypted.
            </p>
          ) : (
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-8">
              Join 5,000+ daily readers · 100% private &amp; encrypted
            </p>
          )}

          {mode === "signup" && (
            <div className="space-y-4 mb-8">
              <label className="flex items-start gap-3 text-xs sm:text-sm font-light leading-relaxed text-stone-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-[#C2A378]"
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" className="text-accent underline underline-offset-4">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-accent underline underline-offset-4">
                    Privacy Policy
                  </Link>
                  , and I acknowledge that readings are generated by AI for entertainment and
                  reflective purposes only.
                </span>
              </label>
              <label className="flex items-start gap-3 text-xs sm:text-sm font-light leading-relaxed text-stone-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-[#C2A378]"
                />
                <span>
                  Optional — send me promotional offers and astrology updates by email.
                </span>
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={signInGoogle}
            disabled={googleBusy || needsConsent}
            className="w-full flex items-center justify-center gap-3 border border-border py-3 mb-6 text-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
          >
            <GoogleGlyph />
            {googleBusy ? "Opening Google…" : "Continue with Google"}
          </button>


          <div className="flex items-center gap-4 mb-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
            />

            {error && (
              <p className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/40 px-4 py-2">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-accent border border-accent/30 bg-accent/5 px-4 py-2">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || needsConsent}
              className="w-full bg-accent text-primary-foreground py-4 font-serif italic text-lg hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:hover:bg-accent"

            >
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {mode === "signin" ? (
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="hover:text-accent transition-colors"
              >
                New here? Create an account →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="hover:text-accent transition-colors"
              >
                Already have an account? Sign in →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block"
      >
        {label}
      </label>
      <input
        id={id}
        name={type === "password" ? "password" : "email"}
        autoComplete={type === "password" ? "current-password" : "email"}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-transparent border-b border-border py-2 focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
