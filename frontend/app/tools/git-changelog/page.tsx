'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { ChangelogInput } from '@/components/shared/ChangelogInput';
import { ChangelogPreview } from '@/components/shared/ChangelogPreview';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { OutputCard } from '@/components/shared/OutputCard';
import { motion, AnimatePresence } from 'framer-motion';

interface ChangelogResult {
  changelog: string;
  commit_count: number;
  statistics: {
    total: number;
    by_type?: Record<string, number>;
    by_author?: Record<string, number>;
    date_range?: {
      from: string;
      to: string;
    };
  };
}

export default function GitChangelogPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChangelogResult | null>(null);

  const handleGenerate = async (data: {
    mode: 'paste' | 'repo';
    value: string;
    branch?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let endpoint = '';
      let body = {};

      if (data.mode === 'paste') {
        endpoint = '/api/v1/changelog/from-log';
        body = {
          commits_text: data.value,
          version: 'Unreleased',
        };
      } else {
        endpoint = '/api/v1/changelog/from-repo';
        body = {
          repo_url: data.value,
          branch: data.branch || 'main',
          version: 'Unreleased',
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Request failed: ${response.statusText}`);
      }

      const data_result: ChangelogResult = await response.json();
      setResult(data_result);
      toast.success('Changelog generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate changelog';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `CHANGELOG-${dateStr}.md`;

    const blob = new Blob([result.changelog], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Downloaded as CHANGELOG.md');
  };

  return (
    <AppShell>
      <ToolPageTemplate
        title="Git Changelog Generator"
        description="Convert git commits into a professional Keep a Changelog formatted document"
      >
        <div className="space-y-6">
          {/* Input Section */}
          <section className="space-y-4 rounded-2xl border border-border bg-background-secondary/50 p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 1: Provide Commits
              </h2>
            </div>
            <ChangelogInput onSubmit={handleGenerate} isLoading={isLoading} error={error} />
          </section>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {isLoading && !result && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12"
              >
                <LoadingSpinner label={error ? 'Analyzing commits...' : 'Generating changelog...'} />
              </motion.div>
            )}

            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OutputCard
                  title="Step 2: Preview & Download"
                  actions={
                    <button
                      onClick={handleDownload}
                      className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  }
                >
                  <ChangelogPreview
                    changelog={result.changelog}
                    statistics={result.statistics}
                    commitCount={result.commit_count}
                  />
                </OutputCard>
              </motion.div>
            )}

            {/* Empty State */}
            {!result && !isLoading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  title="Paste a commit log or provide a GitHub URL"
                  description="Supports conventional commits and freeform messages. Generates a clean CHANGELOG.md"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
