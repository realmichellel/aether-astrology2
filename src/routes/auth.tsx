import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Aether" },
      { name: "description", content: "Enter the observatory. Sign in or create an Aether account." },
      { property: "og:title", content: "Sign in — Aether" },
      { property: "og:description", content: "Enter the observatory." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
    setGoogleBusy(true);
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link to="/" className="text-xl font-serif italic tracking-widest text-accent">
          AETHER
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
            {mode === "signin" ? "Return" : "Begin"}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-light italic mb-10">
            {mode === "signin" ? "Enter the observatory." : "Open an account."}
          </h1>

          <button
            type="button"
            onClick={signInGoogle}
            disabled={googleBusy}
            className="w-full flex items-center justify-center gap-3 border border-border py-3 mb-6 text-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
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
              disabled={busy}
              className="w-full bg-accent text-primary-foreground py-4 font-serif italic text-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
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
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">
        {label}
      </label>
      <input
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
