import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ConsentGate } from "@/components/ConsentGate";

export function AppNav() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <>
    <ConsentGate />
    <nav className="flex flex-col gap-3 px-5 py-5 border-b border-border sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="text-xl font-serif italic tracking-widest text-gilded"
        >
          AETHER
        </Link>
        <button
          onClick={signOut}
          className="text-[10px] uppercase tracking-[0.15em] font-medium text-muted-foreground hover:text-accent transition-colors sm:hidden"
        >
          Sign out
        </button>
      </div>
      <div className="flex items-center gap-5 overflow-x-auto text-[10px] uppercase tracking-[0.15em] font-medium sm:gap-8 sm:tracking-[0.2em] [&>*]:shrink-0">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          Today
        </Link>
        <Link to="/you" className="text-muted-foreground hover:text-foreground transition-colors">
          You
        </Link>
        <Link to="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
          Oracle
        </Link>
        <Link to="/journal" className="text-muted-foreground hover:text-foreground transition-colors">
          Chronicles
        </Link>
        <Link to="/compatibility" className="text-muted-foreground hover:text-foreground transition-colors">
          Compatibility
        </Link>
        <button
          onClick={signOut}
          className="hidden text-muted-foreground hover:text-accent transition-colors sm:inline"
        >
          Sign out
        </button>
      </div>
    </nav>
    </>
  );

}