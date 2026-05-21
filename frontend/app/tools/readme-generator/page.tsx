"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
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

const SAMPLE_URL = "https://github.com/fastapi/fastapi";

const GITHUB_URL_RE =
  /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

export default function ReadmeGeneratorPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const { data: streamedData, error, isLoading, start, reset } = useStream();
  const [hasGenerated, setHasGenerated] = useState(false);

  const urlValid =
    repoUrl.trim().length === 0 || GITHUB_URL_RE.test(repoUrl.trim());
  const canGenerate =
    repoUrl.trim().length > 0 &&
    GITHUB_URL_RE.test(repoUrl.trim()) &&
    !isLoading;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setHasGenerated(true);
    setShowPreview(true);

    await start(buildApiUrl("/api/v1/tools/readme/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl.trim() }),
    });
  }, [repoUrl, canGenerate, start]);

  useKeyboardShortcut(handleGenerate, !canGenerate);

  const handleTryExample = useCallback(() => {
    setRepoUrl(SAMPLE_URL);
    reset();
    setHasGenerated(false);
  }, [reset]);

  // Parse SSE stream
  const lines = streamedData.split("\n").filter((l) => l.startsWith("data: "));
  let repoName = "";
  let techStack: Record<string, string[]> = {};
  let fileCount = 0;
  let streamError = "";
  let readmeText = "";

  for (const line of lines) {
    try {
      const payload = JSON.parse(line.slice(6));
      if (payload.meta) {
        repoName = payload.meta.repo_name || "";
        techStack = payload.meta.tech_stack || {};
        fileCount = payload.meta.file_count || 0;
      } else if (payload.token) {
        readmeText += payload.token;
      } else if (payload.error) {
        streamError = payload.error;
      }
    } catch {
      // skip
    }
  }

  const displayError = error || streamError;

  return (
    <AppShell>
      <ToolPageTemplate
        title="README Auto-Generator"
        description="Paste a GitHub repo URL and get a professional README.md generated from the actual codebase. Auto-detects tech stack, file structure, and key dependencies."
      >
        <div className="space-y-6">
          {/* ── Repo URL Input ── */}
          <div className="space-y-3">
            <label htmlFor="repo-url" className="text-sm font-semibold">
              GitHub Repository URL
            </label>
            <input
              id="repo-url"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className={cn(
                "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground",
                "placeholder:text-foreground-muted",
                "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
                "transition-default",
                !urlValid &&
                  "border-error/60 focus:border-error/60 focus:ring-error/30"
              )}
            />
            {!urlValid && (
              <p className="text-xs text-error">
                Please enter a valid GitHub URL (https://github.com/owner/repo)
              </p>
            )}
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
                Analyzing repo…
              </span>
            ) : (
              "Generate README"
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
                  title="Generation failed"
                  description={displayError}
                  action={
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary"
                    >
                      Retry
                    </button>
                  }
                />
              </motion.div>
            )}

            {!displayError && readmeText.length > 0 && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <OutputCard
                  title={repoName || "Generated README"}
                  actions={
                    <>
                      {/* Preview / Edit toggle */}
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary"
                      >
                        {showPreview ? "Edit" : "Preview"}
                      </button>
                      <CopyButton text={readmeText} />
                      <DownloadButton
                        content={readmeText}
                        fileName="README.md"
                        mimeType="text/markdown"
                      />
                    </>
                  }
                >
                  <div className="space-y-4">
                    {/* Tech stack badges */}
                    {(techStack.languages?.length > 0 ||
                      techStack.frameworks?.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {techStack.languages?.map((lang: string) => (
                          <span
                            key={lang}
                            className="rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2 py-0.5 text-xs font-medium text-accent-primary"
                          >
                            {lang}
                          </span>
                        ))}
                        {techStack.frameworks?.map((fw: string) => (
                          <span
                            key={fw}
                            className="rounded-full border border-accent-secondary/30 bg-accent-secondary/10 px-2 py-0.5 text-xs font-medium text-accent-secondary"
                          >
                            {fw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Content area — preview or edit */}
                    {showPreview ? (
                      <div className="prose prose-sm prose-invert max-w-none rounded-xl border border-border bg-background-tertiary/50 p-5">
                        <ReactMarkdown>{readmeText}</ReactMarkdown>
                        {isLoading && (
                          <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-accent-primary" />
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={readmeText}
                        readOnly
                        rows={24}
                        className="w-full resize-y rounded-xl border border-border bg-background-tertiary/50 p-5 font-mono text-xs leading-relaxed text-foreground focus:outline-none"
                      />
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3">
                      {fileCount > 0 && (
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted">
                          {fileCount} files analyzed
                        </span>
                      )}
                      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted">
                        {readmeText.length.toLocaleString()} chars
                      </span>
                    </div>
                  </div>
                </OutputCard>
              </motion.div>
            )}

            {!displayError &&
              readmeText.length === 0 &&
              !isLoading &&
              !hasGenerated && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    title="No README generated yet"
                    description="Paste a public GitHub repository URL above and click Generate to create a professional README."
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

            {isLoading && readmeText.length === 0 && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner label="Fetching repo and generating README…" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
