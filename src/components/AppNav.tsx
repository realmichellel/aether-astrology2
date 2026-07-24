import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export function AppNav() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
      <Link
        to="/dashboard"
        className="text-xl font-serif italic tracking-widest text-accent"
      >
        AETERNA
      </Link>
      <div className="flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-medium">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          Today
        </Link>
        <Link to="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
          Oracle
        </Link>
        <Link to="/journal" className="text-muted-foreground hover:text-foreground transition-colors">
          Chronicles
        </Link>
        <button
          onClick={signOut}
          className="text-muted-foreground hover:text-accent transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
