import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-6 h-72 w-72 rounded-full bg-accent-primary/20 blur-3xl" />
        <div className="absolute top-12 right-0 h-96 w-96 rounded-full bg-accent-secondary/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.5),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.08),transparent_55%)]" />
      </div>

      <Header />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pb-16 pt-8 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
