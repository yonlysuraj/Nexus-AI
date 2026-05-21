"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  section_name: string;
  original_text: string;
  optimized_text: string;
  keywords_added: string[];
};

type OptimizationSuggestionsProps = {
  suggestions: Suggestion[];
};

export function OptimizationSuggestions({
  suggestions,
}: OptimizationSuggestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Optimization Suggestions
        </h3>
        <p className="mt-1 text-sm text-foreground-muted">
          Review suggested edits before adding them to your resume.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="mt-5 rounded-xl border border-border bg-background-secondary/60 p-6 text-center text-sm text-foreground-muted">
          No rewrite suggestions were returned for this match.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {suggestions.map((suggestion, index) => {
            const isOpen = expandedIndex === index;
            const originalKey = `${index}-original`;
            const optimizedKey = `${index}-optimized`;

            return (
              <div
                key={`${suggestion.section_name}-${index}`}
                className="overflow-hidden rounded-xl border border-border bg-background-secondary/50"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-default hover:bg-background-tertiary/50"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {suggestion.section_name}
                    </h4>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {suggestion.keywords_added.length} keywords added
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-foreground-muted transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="space-y-4 border-t border-border p-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <SuggestionText
                        title="Original"
                        text={suggestion.original_text}
                        onCopy={() => copyText(suggestion.original_text, originalKey)}
                        copied={copiedKey === originalKey}
                      />
                      <SuggestionText
                        title="Optimized"
                        text={suggestion.optimized_text}
                        keywords={suggestion.keywords_added}
                        onCopy={() =>
                          copyText(suggestion.optimized_text, optimizedKey)
                        }
                        copied={copiedKey === optimizedKey}
                      />
                    </div>

                    {suggestion.keywords_added.length > 0 ? (
                      <div className="rounded-xl border border-accent-secondary/25 bg-accent-secondary/10 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-secondary">
                          Keywords Added
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.keywords_added.map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full border border-accent-secondary/25 bg-background/70 px-2.5 py-1 text-xs text-foreground-secondary"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-warning/25 bg-warning/10 p-4 text-sm text-foreground-secondary">
        Keep suggestions truthful. Add keywords only when they reflect real
        experience you can confidently discuss.
      </div>
    </div>
  );
}

function SuggestionText({
  title,
  text,
  keywords = [],
  onCopy,
  copied,
}: {
  title: string;
  text: string;
  keywords?: string[];
  onCopy: () => void;
  copied: boolean;
}) {
  const highlighted = useMemo(() => {
    if (keywords.length === 0) return text;
    return text;
  }, [keywords.length, text]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h5 className="text-sm font-semibold text-foreground-secondary">
          {title}
        </h5>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full border border-border p-2 text-foreground-muted transition-default hover:border-accent-primary/50 hover:text-accent-primary"
          aria-label={`Copy ${title.toLowerCase()} text`}
          title={`Copy ${title.toLowerCase()} text`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-background/70 p-3 font-mono text-xs leading-relaxed text-foreground-secondary">
        {highlighted}
      </div>
    </div>
  );
}
