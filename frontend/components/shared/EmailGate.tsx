"use client";

import { useState, useEffect, ReactNode } from "react";
import { Mail, Sparkles } from "lucide-react";

export function EmailGate({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("nexus_user_email");
    if (savedEmail) {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    
    localStorage.setItem("nexus_user_email", email.trim());
    setHasAccess(true);
  };

  if (hasAccess === null) {
    // Return null or a skeleton while checking local storage to prevent hydration mismatch
    return null;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background-secondary p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-foreground">
          Welcome to NexusAI
        </h2>
        <p className="mt-2 text-center text-sm text-foreground-secondary">
          Enter your email to unlock all 10 AI tools for free during our preview phase.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-foreground-muted" />
              </div>
              <input
                type="email"
                id="email"
                required
                className="block w-full rounded-xl border border-border bg-background/50 py-3 pl-10 pr-3 text-sm text-foreground placeholder-foreground-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary py-3 text-sm font-semibold text-white transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Get Access
          </button>
        </form>
      </div>
    </div>
  );
}
