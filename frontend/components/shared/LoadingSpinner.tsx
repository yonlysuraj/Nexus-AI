import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({ label = "Loading", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary/40 border-t-accent-primary" />
      <span className="text-foreground-muted">{label}</span>
    </div>
  );
}
