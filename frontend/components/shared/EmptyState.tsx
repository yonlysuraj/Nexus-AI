import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const fallbackAction =
    actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="rounded-full border border-border/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary"
      >
        {actionLabel}
      </button>
    ) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border/70 bg-background/60 p-6",
        className
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description ? (
        <p className="text-sm text-foreground-secondary">{description}</p>
      ) : null}
      {action || fallbackAction ? <div>{action ?? fallbackAction}</div> : null}
    </div>
  );
}
