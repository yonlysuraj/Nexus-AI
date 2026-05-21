"use client";

import { AlertTriangle, CheckCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchScoreCardProps = {
  matchScore: number;
  matchedCount: number;
  missingCount: number;
  criticalGapsCount: number;
};

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      label: "Excellent match",
      description: "Your resume strongly aligns with this role.",
      color: "text-success",
      ring: "stroke-success",
      bg: "bg-success/10 border-success/25",
    };
  }
  if (score >= 60) {
    return {
      label: "Good match",
      description: "You cover many core requirements with a few gaps.",
      color: "text-accent-secondary",
      ring: "stroke-accent-secondary",
      bg: "bg-accent-secondary/10 border-accent-secondary/25",
    };
  }
  if (score >= 40) {
    return {
      label: "Moderate match",
      description: "The foundation is relevant, but key terms are missing.",
      color: "text-warning",
      ring: "stroke-warning",
      bg: "bg-warning/10 border-warning/25",
    };
  }
  return {
    label: "Needs work",
    description: "This resume needs stronger alignment before applying.",
    color: "text-error",
    ring: "stroke-error",
    bg: "bg-error/10 border-error/25",
  };
}

export function MatchScoreCard({
  matchScore,
  matchedCount,
  missingCount,
  criticalGapsCount,
}: MatchScoreCardProps) {
  const tone = scoreTone(matchScore);
  const circumference = 2 * Math.PI * 44;
  const dash = (Math.max(0, Math.min(matchScore, 100)) / 100) * circumference;

  return (
    <div className={cn("rounded-2xl border p-6 shadow-sm", tone.bg)}>
      <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
        <div className="relative mx-auto h-36 w-36">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              strokeWidth="8"
              className="stroke-background-tertiary"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className={cn("transition-all duration-500", tone.ring)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-4xl font-bold", tone.color)}>
              {matchScore}
            </span>
            <span className="text-xs text-foreground-muted">/100</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Target className={cn("h-5 w-5", tone.color)} />
            <h3 className={cn("text-xl font-semibold", tone.color)}>
              {tone.label}
            </h3>
          </div>
          <p className="mt-2 text-sm text-foreground-secondary">
            {tone.description}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric
              icon={<CheckCircle className="h-4 w-4" />}
              label="Matched"
              value={matchedCount}
              className="text-success"
            />
            <Metric
              icon={<Target className="h-4 w-4" />}
              label="Missing"
              value={missingCount}
              className="text-error"
            />
            <Metric
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Gaps"
              value={criticalGapsCount}
              className="text-warning"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-3 text-center">
      <div className={cn("mx-auto flex items-center justify-center gap-1", className)}>
        {icon}
        <span className="text-2xl font-semibold">{value}</span>
      </div>
      <p className="mt-1 text-xs text-foreground-muted">{label}</p>
    </div>
  );
}
