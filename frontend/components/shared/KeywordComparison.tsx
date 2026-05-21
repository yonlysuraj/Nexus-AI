"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type KeywordComparisonProps = {
  matchedKeywords: string[];
  missingKeywords: string[];
  criticalGaps?: string[];
};

type Filter = "all" | "critical";

export function KeywordComparison({
  matchedKeywords,
  missingKeywords,
  criticalGaps = [],
}: KeywordComparisonProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const visibleMatched = expanded ? matchedKeywords : matchedKeywords.slice(0, 8);
  const missingSource = filter === "critical" ? criticalGaps : missingKeywords;
  const visibleMissing = expanded ? missingSource : missingSource.slice(0, 8);
  const hasMore =
    matchedKeywords.length > visibleMatched.length ||
    missingSource.length > visibleMissing.length;

  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Keyword Comparison
          </h3>
          <p className="mt-1 text-sm text-foreground-muted">
            What the resume already covers, and what the JD still emphasizes.
          </p>
        </div>
        {criticalGaps.length > 0 ? (
          <div className="flex rounded-full border border-border/70 bg-background-secondary/60 p-1">
            {(["all", "critical"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-default",
                  filter === option
                    ? "bg-accent-primary text-white"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                {option === "all" ? "All" : "Critical"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <KeywordColumn
          title="Matched"
          count={matchedKeywords.length}
          keywords={visibleMatched}
          tone="success"
          empty="No matched keywords yet."
        />
        <KeywordColumn
          title={filter === "critical" ? "Critical Gaps" : "Missing"}
          count={missingSource.length}
          keywords={visibleMissing}
          tone={filter === "critical" ? "warning" : "error"}
          empty="No missing keywords found."
        />
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm font-medium text-foreground-secondary transition-default hover:border-accent-primary/50 hover:text-foreground"
        >
          {expanded ? "Show less" : "Show more keywords"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
          />
        </button>
      ) : null}
    </div>
  );
}

function KeywordColumn({
  title,
  count,
  keywords,
  tone,
  empty,
}: {
  title: string;
  count: number;
  keywords: string[];
  tone: "success" | "warning" | "error";
  empty: string;
}) {
  const toneClass = {
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/25 bg-warning/10 text-warning",
    error: "border-error/25 bg-error/10 text-error",
  }[tone];

  return (
    <div className="rounded-xl border border-border/60 bg-background-secondary/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-xs text-foreground-muted">{count}</span>
      </div>
      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                toneClass
              )}
            >
              {keyword}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground-muted">{empty}</p>
      )}
    </div>
  );
}
