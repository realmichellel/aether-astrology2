import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalLayout({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-5 py-5 border-b border-border sm:px-8 sm:py-6">
        <Link to="/" className="text-xl font-serif italic tracking-widest text-accent">
          AETHER
        </Link>
        <Link
          to="/auth"
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-5">{eyebrow}</p>
        <h1 className="font-serif text-3xl sm:text-5xl font-light italic mb-10">{title}</h1>
        <div className="space-y-10">{children}</div>
      </main>

      <footer className="py-10 border-t border-border">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-[10px] uppercase tracking-widest text-muted-foreground">
          © Aether
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl sm:text-2xl font-light text-stone-100 mb-4">{heading}</h2>
      <div className="space-y-4 text-sm sm:text-base font-light leading-relaxed text-stone-400">
        {children}
      </div>
    </section>
  );
}
