import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToolPageTemplateProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ToolPageTemplate({
  title,
  description,
  actions,
  children,
  className,
}: ToolPageTemplateProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background-secondary/70 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
              Tool Workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              {title}
            </h1>
          </div>
          {actions ? <div className="flex gap-3">{actions}</div> : null}
        </div>
        {description ? (
          <p className="max-w-2xl text-sm text-foreground-secondary">
            {description}
          </p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-border/70 bg-background-secondary/70 p-6 shadow-sm">
        {children}
      </div>
    </section>
  );
}
