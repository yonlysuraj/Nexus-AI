"use client";

import { useRef, useState } from "react";
import { FileSearch } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ToolPageTemplate } from "@/components/shared/ToolPageTemplate";
import { ResumeUpload } from "@/components/shared/ResumeUpload";
import { JobDescriptionInput } from "@/components/shared/JobDescriptionInput";
import { MatchScoreCard } from "@/components/shared/MatchScoreCard";
import { KeywordComparison } from "@/components/shared/KeywordComparison";
import { OptimizationSuggestions } from "@/components/shared/OptimizationSuggestions";
import { ATSTips } from "@/components/shared/ATSTips";
import { EmptyState } from "@/components/shared/EmptyState";
import { OutputSkeleton } from "@/components/shared/OutputSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { buildApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

type MatchResult = {
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  critical_gaps: string[];
};

type Suggestion = {
  section_name: string;
  original_text: string;
  optimized_text: string;
  keywords_added: string[];
};

type ResumeOptimizeResponse = {
  match_result: MatchResult;
  suggestions: Suggestion[];
  ats_tips: string[];
};

export default function ResumeOptimizerPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ResumeOptimizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const canAnalyze =
    Boolean(resumeFile) && jobDescription.trim().length >= 80 && !isLoading;

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Upload a resume before calculating a match.");
      return;
    }
    if (jobDescription.trim().length < 80) {
      setError("Paste a fuller job description before calculating a match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume_file", resumeFile);
    formData.append("job_description", jobDescription.trim());

    try {
      const response = await fetch(buildApiUrl("/api/v1/resume-optimizer/"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || `Request failed: ${response.status}`);
      }

      const payload = (await response.json()) as ResumeOptimizeResponse;
      setResult(payload);
      toast.success("Resume match calculated");
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to optimize resume";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useKeyboardShortcut(handleAnalyze, !canAnalyze);

  return (
    <AppShell>
      <ToolPageTemplate
        title="Resume Optimizer"
        description="Compare a resume against a job description, spot keyword gaps, and get targeted rewrite suggestions."
        icon={<FileSearch className="h-7 w-7 text-accent-primary" />}
      >
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="space-y-4 rounded-2xl border border-border bg-background-secondary/50 p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Resume
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Upload the PDF or DOCX you want to analyze.
                </p>
              </div>
              <ResumeUpload onUpload={setResumeFile} isLoading={isLoading} />
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-background-secondary/50 p-5">
              <JobDescriptionInput
                onInput={setJobDescription}
                isLoading={isLoading}
              />
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 p-4">
            <p className="text-sm text-foreground-secondary">
              Ready when a resume is selected and the job description has enough
              detail to compare.
            </p>
            <button
              type="button"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              className={cn(
                "rounded-xl px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-default",
                "bg-gradient-to-r from-accent-primary to-accent-secondary",
                canAnalyze
                  ? "hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/20"
                  : "cursor-not-allowed opacity-50"
              )}
            >
              {isLoading ? "Calculating..." : "Calculate Match"}
            </button>
          </div>

          {error ? (
            <ErrorState
              title="Resume optimization failed"
              description={error}
              action={
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary disabled:opacity-50"
                >
                  Retry
                </button>
              }
            />
          ) : null}

          {isLoading ? (
            <div className="flex flex-col gap-4">
              <LoadingSpinner label="Analyzing resume match..." />
              <OutputSkeleton />
            </div>
          ) : null}

          <div ref={resultsRef} className="space-y-6">
            {result ? (
              <>
                <MatchScoreCard
                  matchScore={result.match_result.match_score}
                  matchedCount={result.match_result.matched_keywords.length}
                  missingCount={result.match_result.missing_keywords.length}
                  criticalGapsCount={result.match_result.critical_gaps.length}
                />
                <KeywordComparison
                  matchedKeywords={result.match_result.matched_keywords}
                  missingKeywords={result.match_result.missing_keywords}
                  criticalGaps={result.match_result.critical_gaps}
                />
                <OptimizationSuggestions suggestions={result.suggestions} />
                <ATSTips tips={result.ats_tips} />
              </>
            ) : !isLoading ? (
              <EmptyState
                title="No match calculated yet"
                description="Upload a resume and paste a job description to see the score, gaps, suggested rewrites, and ATS tips."
              />
            ) : null}
          </div>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
