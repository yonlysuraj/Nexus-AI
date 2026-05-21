"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/15 text-accent-primary">
            <span className="text-lg font-semibold">N</span>
          </div>
          <div>
            <p className="text-lg font-semibold">NexusAI</p>
            <p className="text-xs text-foreground-muted">AI productivity toolkit</p>
          </div>
        </div>

        <div className="hidden w-full max-w-md items-center gap-2 rounded-full border border-border bg-background-secondary/80 px-4 py-2 text-sm text-foreground-muted shadow-sm lg:flex">
          <span className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Search</span>
          <input
            placeholder="Find a tool or feature"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
              "rounded-full border border-border px-3 py-2 text-xs font-medium uppercase tracking-wide transition-default",
              "hover:border-accent-primary/50 hover:text-accent-primary"
            )}
          >
            {isDark ? "Light" : "Dark"}
          </button>
          <Link
            href="https://github.com/yonlysuraj/Nexus-AI"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-foreground-muted transition-default hover:border-accent-secondary/60 hover:text-accent-secondary"
          >
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}
