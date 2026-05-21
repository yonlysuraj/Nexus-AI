'use client';

import ReactMarkdown from 'react-markdown';
import { CopyButton } from './CopyButton';
import { cn } from '@/lib/utils';

interface ChangelogStatistics {
  total: number;
  by_type?: Record<string, number>;
  by_author?: Record<string, number>;
  date_range?: {
    from: string;
    to: string;
  };
}

interface ChangelogPreviewProps {
  changelog: string;
  statistics: ChangelogStatistics;
  commitCount: number;
}

export function ChangelogPreview({
  changelog,
  statistics,
  commitCount,
}: ChangelogPreviewProps) {
  const categories = statistics.by_type || {};
  const authors = Object.keys(statistics.by_author || {});

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-accent-primary/10 rounded-xl p-4 border border-accent-primary/30">
          <p className="text-sm text-accent-primary">Total Commits</p>
          <p className="text-2xl font-bold text-foreground">{commitCount}</p>
        </div>

        <div className="bg-accent-secondary/10 rounded-xl p-4 border border-accent-secondary/30">
          <p className="text-sm text-accent-secondary">New Features</p>
          <p className="text-2xl font-bold text-foreground">
            {categories['feat'] || 0}
          </p>
        </div>

        <div className="bg-warning/10 rounded-xl p-4 border border-warning/30">
          <p className="text-sm text-warning">Bug Fixes</p>
          <p className="text-2xl font-bold text-foreground">
            {categories['fix'] || 0}
          </p>
        </div>

        <div className="bg-success/10 rounded-xl p-4 border border-success/30">
          <p className="text-sm text-success">Contributors</p>
          <p className="text-2xl font-bold text-foreground">
            {authors.length}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categories).length > 0 && (
        <div className="bg-background-tertiary/50 border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Commit Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(categories).map(([type, count]) => (
              <div
                key={type}
                className="bg-background-secondary/70 rounded-lg p-3 flex items-center justify-between border border-border"
              >
                <span className="text-sm font-semibold text-foreground capitalize">
                  {type}
                </span>
                <span className="text-lg font-bold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changelog Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Changelog Output</h3>
          <CopyButton text={changelog} />
        </div>

        <div className="prose prose-sm prose-invert max-w-none rounded-xl border border-border bg-background-tertiary/50 p-5 overflow-x-auto text-foreground">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 text-foreground" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-2 mb-1 text-foreground" {...props} />,
              p: ({ node, ...props }) => <p className="text-foreground-secondary my-2 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside text-foreground-secondary my-2" {...props} />
              ),
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              code: ({ node, ...props }) => (
                <code
                  className="rounded bg-background-secondary px-1.5 py-0.5 text-xs text-foreground font-mono"
                  {...props}
                />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-border pl-4 my-2 text-foreground-muted" {...props} />
              ),
            }}
          >
            {changelog}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
