import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
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
      {action ? <div>{action}</div> : null}
    </div>
  );
}
