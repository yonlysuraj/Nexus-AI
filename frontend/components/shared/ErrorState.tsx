import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border border-border bg-background/70 p-6",
        className
      )}
    >
      <p className="text-sm font-semibold text-error">{title}</p>
      {description ? (
        <p className="text-sm text-foreground-secondary">{description}</p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
