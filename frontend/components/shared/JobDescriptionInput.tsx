"use client";

import { useMemo, useState } from "react";
import { Clipboard, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type JobDescriptionInputProps = {
  onInput: (text: string) => void;
  isLoading?: boolean;
};

const SAMPLE_JD = `Senior Frontend Developer

About the Role:
We're looking for an experienced Frontend Developer to join our growing team. You will work on modern web applications using React and TypeScript, collaborating with designers and backend engineers.

Responsibilities:
- Develop and maintain React components and applications
- Implement responsive UI designs using Tailwind CSS
- Write unit tests using Jest and React Testing Library
- Collaborate with backend teams via REST and GraphQL APIs
- Optimize application performance and user experience

Requirements:
- 5+ years of professional frontend development experience
- Expert proficiency in React and JavaScript/TypeScript
- Strong understanding of HTML, CSS, and responsive design
- Experience with state management (Redux, Zustand, or similar)
- Proficiency with Git and modern development tools
- Experience with testing frameworks (Jest, Vitest)

Nice to Have:
- Experience with Next.js or other React frameworks
- Knowledge of performance optimization techniques
- Experience with CI/CD pipelines
- Familiarity with design systems`;

export function JobDescriptionInput({
  onInput,
  isLoading = false,
}: JobDescriptionInputProps) {
  const [text, setText] = useState("");

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text]
  );

  const updateText = (value: string) => {
    setText(value);
    onInput(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor="job-description" className="text-sm font-semibold">
            Job Description
          </label>
          <p className="mt-1 text-xs text-foreground-muted">
            Paste requirements, responsibilities, and preferred skills.
          </p>
        </div>
        <div className="text-xs text-foreground-muted">
          {text.length.toLocaleString()} chars / {wordCount.toLocaleString()}{" "}
          words
        </div>
      </div>

      <textarea
        id="job-description"
        value={text}
        onChange={(event) => updateText(event.target.value)}
        disabled={isLoading}
        placeholder="Paste the full job description here..."
        rows={14}
        className={cn(
          "w-full resize-y rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-mono text-sm leading-relaxed text-foreground",
          "placeholder:text-foreground-muted transition-default",
          "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Clipboard className="h-4 w-4" />
          Full descriptions usually produce better keyword coverage.
        </div>
        <div className="flex gap-2">
          {text ? (
            <button
              type="button"
              onClick={() => updateText("")}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary transition-default hover:border-error/50 hover:text-error disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => updateText(SAMPLE_JD)}
            disabled={isLoading}
            className="rounded-full border border-border/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary transition-default hover:border-accent-primary/60 hover:text-accent-primary disabled:opacity-60"
          >
            Use Sample
          </button>
        </div>
      </div>
    </div>
  );
}
