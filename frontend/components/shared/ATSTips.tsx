"use client";

import { CheckCircle2 } from "lucide-react";

type ATSTipsProps = {
  tips: string[];
};

const FALLBACK_TIPS = [
  "Use standard section headings such as Summary, Skills, Experience, Education, and Projects.",
  "Mirror important job description keywords only where they truthfully match your experience.",
  "Avoid text embedded inside images, icons, or complex tables.",
  "Keep dates, job titles, company names, and skills easy to scan.",
  "Prefer clear bullets with impact, tools used, and measurable outcomes.",
];

export function ATSTips({ tips }: ATSTipsProps) {
  const visibleTips = tips.length > 0 ? tips : FALLBACK_TIPS;

  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">ATS Tips</h3>
      <p className="mt-1 text-sm text-foreground-muted">
        Practical fixes to improve parser readability and keyword alignment.
      </p>

      <ul className="mt-5 space-y-3">
        {visibleTips.map((tip, index) => (
          <li
            key={`${tip}-${index}`}
            className="flex gap-3 rounded-xl border border-border/60 bg-background-secondary/50 p-3 text-sm text-foreground-secondary"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-success" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
