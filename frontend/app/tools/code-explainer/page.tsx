"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { ToolPageTemplate } from "@/components/shared/ToolPageTemplate";
import { CopyButton } from "@/components/shared/CopyButton";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { OutputCard } from "@/components/shared/OutputCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useStream } from "@/lib/useStream";
import { buildApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Simple explanation, minimal jargon",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Logic, flow, and main structures",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Tradeoffs, edge cases, and complexity",
  },
] as const;

const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
] as const;

type Level = (typeof LEVELS)[number]["value"];

type Language = (typeof LANGUAGES)[number]["value"];

const SAMPLE_CODE = `def fibonacci(n):
    if n <= 1:
        return n

    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

print(fibonacci(10))`;

export default function CodeExplainerPage() {
  const [code, setCode] = useState("");
  const [level, setLevel] = useState<Level>("intermediate");
  const [language, setLanguage] = useState<Language>("auto");
  const { data: streamedData, error, isLoading, start, reset } = useStream();
  const [hasGenerated, setHasGenerated] = useState(false);

  const canGenerate = code.trim().length >= 20 && !isLoading;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setHasGenerated(true);

    const payload: Record<string, string> = {
      code: code.trim(),
      level,
    };
    if (language !== "auto") {
      payload.language = language;
    }

    await start(buildApiUrl("/api/v1/tools/code-explainer/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }, [canGenerate, code, level, language, start]);

  const handleTryExample = useCallback(() => {
    setCode(SAMPLE_CODE);
    reset();
    setHasGenerated(false);
  }, [reset]);

  const handleRetry = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const lines = streamedData.split("\n").filter((l) => l.startsWith("data: "));
  let explanationText = "";
  let detectedLanguage = "";
  let stats: Record<string, number> = {};
  let streamError = "";

  for (const line of lines) {
    try {
      const payload = JSON.parse(line.slice(6));
      if (payload.meta) {
        detectedLanguage = payload.meta.detected_language || "";
        stats = payload.meta.stats || {};
      } else if (payload.token) {
        explanationText += payload.token;
      } else if (payload.error) {
        streamError = payload.error;
      }
    } catch {
      // skip malformed chunks
    }
  }

  const displayError = error || streamError;

  const statsBadges = useMemo(() => {
    const badges: Array<{ label: string; value: string }> = [];
    if (detectedLanguage) {
      badges.push({
        label: "Language",
        value: detectedLanguage,
      });
    }
    if (stats.total_lines !== undefined) {
      badges.push({ label: "Lines", value: `${stats.total_lines}` });
    }
    if (stats.function_count !== undefined) {
      badges.push({ label: "Functions", value: `${stats.function_count}` });
    }
    if (stats.class_count !== undefined) {
      badges.push({ label: "Classes", value: `${stats.class_count}` });
    }
    if (stats.import_count !== undefined) {
      badges.push({ label: "Imports", value: `${stats.import_count}` });
    }
    return badges;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedLanguage, JSON.stringify(stats)]);

  return (
    <AppShell>
      <ToolPageTemplate
        title="Codebase Explainer"
        description="Paste code and get a clear explanation at the right depth. Choose a language and detail level, then let AI break it down."
        actions={
          <button
            type="button"
            onClick={handleTryExample}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary"
          >
            Try Example
          </button>
        }
      >
        <div className="space-y-6">
          {/* ── Code Input ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="code-editor" className="text-sm font-semibold">
                Code Snippet
              </label>
              <span className="text-xs text-foreground-muted">
                {code.length} chars
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-background/70">
              <MonacoEditor
                height="320px"
                language={language === "auto" ? "plaintext" : language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value ?? "")}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
              />
            </div>
            {code.trim().length > 0 && code.trim().length < 20 && (
              <p className="text-xs text-warning">
                Add at least 20 characters of code to generate an explanation.
              </p>
            )}
          </div>

          {/* ── Language Selector ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Language</p>
            <div className="flex flex-wrap gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setLanguage(lang.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default",
                    language === lang.value
                      ? "border-accent-primary/60 bg-accent-primary/10 text-accent-primary"
                      : "border-border text-foreground-secondary hover:border-accent-primary/40 hover:text-foreground"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Level Selector ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Explanation Level</p>
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
                Explaining…
              </span>
            ) : (
              "Explain Code"
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
                  title="Explanation failed"
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

            {!displayError && explanationText.length > 0 && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <OutputCard
                  title="Explanation"
                  actions={
                    <>
                      <CopyButton text={explanationText} />
                      <DownloadButton
                        content={explanationText}
                        fileName="code-explanation.txt"
                      />
                    </>
                  }
                >
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap rounded-xl border border-border bg-background-tertiary/50 p-5 text-sm leading-relaxed text-foreground">
                      {explanationText}
                      {isLoading && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-accent-primary" />
                      )}
                    </div>

                    {statsBadges.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
                        {statsBadges.map((badge) => (
                          <span
                            key={`${badge.label}-${badge.value}`}
                            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted"
                          >
                            {badge.label}: {badge.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </OutputCard>
              </motion.div>
            )}

            {!displayError &&
              explanationText.length === 0 &&
              !isLoading &&
              !hasGenerated && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    title="Paste code to get started"
                    description="Drop in a function, class, or file and choose the depth that matches your audience."
                    actionLabel="Use sample code"
                    onAction={handleTryExample}
                  />
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
