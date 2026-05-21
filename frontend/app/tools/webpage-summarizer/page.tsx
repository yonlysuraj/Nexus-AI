"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { ToolPageTemplate } from "@/components/shared/ToolPageTemplate";
import { CopyButton } from "@/components/shared/CopyButton";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { OutputCard } from "@/components/shared/OutputCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useStream } from "@/lib/useStream";
import { buildApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

const LEVELS = [
  { value: "tldr", label: "TL;DR", description: "1-2 sentence summary" },
  {
    value: "key_points",
    label: "Key Points",
    description: "5-7 bullet points",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "2-3 paragraph analysis",
  },
] as const;

type Level = (typeof LEVELS)[number]["value"];

const SAMPLE_URL = "https://en.wikipedia.org/wiki/Artificial_intelligence";

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function WebpageSummarizerPage() {
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState<Level>("key_points");
  const { data: streamedData, error, isLoading, start, reset } = useStream();
  const [hasGenerated, setHasGenerated] = useState(false);

  const urlValid = isValidUrl(url.trim());
  const canGenerate = url.trim().length > 0 && urlValid && !isLoading;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setHasGenerated(true);

    await start(buildApiUrl("/api/v1/tools/webpage-summary/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), level }),
    });
  }, [url, level, canGenerate, start]);

  useKeyboardShortcut(handleGenerate, !canGenerate);

  const handleTryExample = useCallback(() => {
    setUrl(SAMPLE_URL);
    reset();
    setHasGenerated(false);
  }, [reset]);

  const handleRetry = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Parse SSE stream
  const lines = streamedData.split("\n").filter((l) => l.startsWith("data: "));
  let pageTitle = "";
  let contentLength = 0;
  let streamError = "";
  let summaryText = "";

  for (const line of lines) {
    try {
      const payload = JSON.parse(line.slice(6));
      if (payload.meta) {
        pageTitle = payload.meta.title || "";
        contentLength = payload.meta.content_length || 0;
      } else if (payload.token) {
        summaryText += payload.token;
      } else if (payload.error) {
        streamError = payload.error;
      }
    } catch {
      // skip malformed lines
    }
  }

  const displayError = error || streamError;

  return (
    <AppShell>
      <ToolPageTemplate
        title="Webpage Summarizer"
        description="Paste any URL and get an AI-powered summary. Choose between a quick TL;DR, key bullet points, or a detailed analysis."
      >
        <div className="space-y-6">
          {/* ── URL Input ── */}
          <div className="space-y-3">
            <label htmlFor="webpage-url" className="text-sm font-semibold">
              Page URL
            </label>
            <div className="flex gap-3">
              <input
                id="webpage-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className={cn(
                  "flex-1 rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground",
                  "placeholder:text-foreground-muted",
                  "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
                  "transition-default",
                  url.trim().length > 0 &&
                    !urlValid &&
                    "border-error/60 focus:border-error/60 focus:ring-error/30"
                )}
              />
            </div>
            {url.trim().length > 0 && !urlValid && (
              <p className="text-xs text-error">
                Please enter a valid URL starting with http:// or https://
              </p>
            )}
          </div>

          {/* ── Level Selector ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Summary Level</p>
            <div className="flex flex-wrap gap-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-default",
                    level === l.value
                      ? "border-accent-primary/60 bg-accent-primary/10"
                      : "border-border hover:border-accent-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      level === l.value
                        ? "text-accent-primary"
                        : "text-foreground-secondary"
                    )}
                  >
                    {l.label}
                  </span>
                  <span className="mt-1 text-xs text-foreground-muted">
                    {l.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Generate Button ── */}
          <button
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className={cn(
              "w-full rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-default sm:w-auto",
              "bg-gradient-to-r from-accent-primary to-accent-secondary",
              canGenerate
                ? "hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/20"
                : "cursor-not-allowed opacity-50"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Summarizing…
              </span>
            ) : (
              "Summarize"
            )}
          </button>

          {/* ── Output Section ── */}
          <AnimatePresence mode="wait">
            {displayError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ErrorState
                  title="Summarization failed"
                  description={displayError}
                  action={
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary"
                    >
                      Retry
                    </button>
                  }
                />
              </motion.div>
            )}

            {!displayError && summaryText.length > 0 && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <OutputCard
                  title={pageTitle || "Summary"}
                  actions={
                    <>
                      <CopyButton text={summaryText} />
                      <DownloadButton
                        content={summaryText}
                        fileName="webpage-summary.txt"
                      />
                    </>
                  }
                >
                  <div className="space-y-4">
                    {/* Summary content */}
                    <div className="whitespace-pre-wrap rounded-xl border border-border bg-background-tertiary/50 p-5 text-sm leading-relaxed text-foreground">
                      {summaryText}
                      {isLoading && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-accent-primary" />
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted">
                        {LEVELS.find((l) => l.value === level)?.label}
                      </span>
                      {contentLength > 0 && (
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted">
                          {contentLength.toLocaleString()} chars extracted
                        </span>
                      )}
                    </div>
                  </div>
                </OutputCard>
              </motion.div>
            )}

            {!displayError &&
              summaryText.length === 0 &&
              !isLoading &&
              !hasGenerated && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    title="No summary yet"
                    description="Paste a URL above and click Summarize to extract the key information from any webpage."
                    action={
                      <button
                        type="button"
                        onClick={handleTryExample}
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary"
                      >
                        Try an Example
                      </button>
                    }
                  />
                </motion.div>
              )}

            {isLoading && summaryText.length === 0 && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner label="Fetching and summarizing page…" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
