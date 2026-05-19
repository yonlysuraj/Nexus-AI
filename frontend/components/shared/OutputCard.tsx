import type { ReactNode } from "react";

type OutputCardProps = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function OutputCard({ title, actions, children }: OutputCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-5 shadow-sm">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          {actions ? <div className="flex gap-2">{actions}</div> : null}
        </div>
      )}
      <div className="text-sm text-foreground-secondary">{children}</div>
    </div>
  );
}
