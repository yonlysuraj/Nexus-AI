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

const TONES = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "casual", label: "Casual", emoji: "☕" },
  { value: "storytelling", label: "Storytelling", emoji: "📖" },
] as const;

type Tone = (typeof TONES)[number]["value"];

const SAMPLE_BULLETS = `Led a team of 5 engineers to rebuild our checkout flow
Reduced page load time from 4.2s to 0.8s
Conversion rate increased 23% in the first month
Used Next.js, edge functions, and a custom caching layer
Biggest lesson: small perf wins compound into massive business impact`;

const LINKEDIN_CHAR_LIMIT = 3000;

export default function LinkedInWriterPage() {
  const [bullets, setBullets] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const { data: streamedPost, error, isLoading, start, reset } = useStream();
  const [hasGenerated, setHasGenerated] = useState(false);

  const canGenerate = bullets.trim().length >= 10 && !isLoading;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setHasGenerated(true);

    await start(buildApiUrl("/api/v1/tools/linkedin-post/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bullets: bullets.trim(), tone }),
    });
  }, [bullets, tone, canGenerate, start]);

  const handleTryExample = useCallback(() => {
    setBullets(SAMPLE_BULLETS);
    reset();
    setHasGenerated(false);
  }, [reset]);

  const handleRetry = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Parse streamed SSE data into plain text
  const parsedPost = streamedPost
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => {
      try {
        const payload = JSON.parse(line.slice(6));
        return payload.token ?? "";
      } catch {
        return "";
      }
    })
    .join("");

  const hashtags = parsedPost.match(/#\w+/g) ?? [];
  const charCount = parsedPost.length;
  const charStatus =
    charCount === 0
      ? "neutral"
      : charCount > LINKEDIN_CHAR_LIMIT
        ? "over"
        : charCount > LINKEDIN_CHAR_LIMIT - 500
          ? "warn"
          : "ok";

  return (
    <AppShell>
      <ToolPageTemplate
        title="LinkedIn Post Writer"
        description="Transform rough bullet points into polished, engaging LinkedIn posts. Choose your tone and let AI craft the perfect hook, structure, and call to action."
      >
        <div className="space-y-6">
          {/* ── Input Section ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="linkedin-bullets"
                className="text-sm font-semibold"
              >
                Your Bullet Points
              </label>
              <span className="text-xs text-foreground-muted">
                {bullets.length} chars
              </span>
            </div>

            <textarea
              id="linkedin-bullets"
              value={bullets}
              onChange={(e) => setBullets(e.target.value)}
              placeholder="Enter your key points, achievements, or ideas — one per line…"
              rows={6}
              className={cn(
                "w-full resize-none rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground",
                "placeholder:text-foreground-muted",
                "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
                "transition-default"
              )}
            />
          </div>

          {/* ── Tone Selector ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Tone</p>
            <div className="flex flex-wrap gap-3">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default",
                    tone === t.value
                      ? "border-accent-primary/60 bg-accent-primary/10 text-accent-primary"
                      : "border-border text-foreground-secondary hover:border-accent-primary/40 hover:text-foreground"
                  )}
                >
                  {t.emoji} {t.label}
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
                Generating…
              </span>
            ) : (
              "Generate Post"
            )}
          </button>

          {/* ── Output Section ── */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ErrorState
                  title="Generation failed"
                  description={error}
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

            {!error && parsedPost.length > 0 && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <OutputCard
                  title="Generated Post"
                  actions={
                    <>
                      <CopyButton text={parsedPost} />
                      <DownloadButton
                        content={parsedPost}
                        fileName="linkedin-post.txt"
                      />
                    </>
                  }
                >
                  <div className="space-y-4">
                    {/* Post content */}
                    <div className="whitespace-pre-wrap rounded-xl border border-border bg-background-tertiary/50 p-5 text-sm leading-relaxed text-foreground">
                      {parsedPost}
                      {isLoading && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-accent-primary" />
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Character count badge */}
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          charStatus === "ok" &&
                            "border-success/30 bg-success/10 text-success",
                          charStatus === "warn" &&
                            "border-warning/30 bg-warning/10 text-warning",
                          charStatus === "over" &&
                            "border-error/30 bg-error/10 text-error",
                          charStatus === "neutral" &&
                            "border-border text-foreground-muted"
                        )}
                      >
                        {charCount} / {LINKEDIN_CHAR_LIMIT} chars
                      </span>

                      {/* Hashtags */}
                      {hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {hashtags.map((tag, i) => (
                            <span
                              key={`${tag}-${i}`}
                              className="rounded-full border border-accent-secondary/30 bg-accent-secondary/10 px-2 py-0.5 text-xs font-medium text-accent-secondary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </OutputCard>
              </motion.div>
            )}

            {!error &&
              parsedPost.length === 0 &&
              !isLoading &&
              !hasGenerated && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    title="No post generated yet"
                    description="Enter your bullet points above and click Generate to create a polished LinkedIn post."
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

            {isLoading && parsedPost.length === 0 && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner label="Crafting your post…" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
