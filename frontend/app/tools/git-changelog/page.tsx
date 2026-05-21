'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { ChangelogInput } from '@/components/shared/ChangelogInput';
import { ChangelogPreview } from '@/components/shared/ChangelogPreview';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

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
    <ToolPageTemplate
      title="Git Changelog Generator"
      description="Convert git commits into a professional Keep a Changelog formatted document"
      icon="📝"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Step 1: Provide Commits
          </h2>
          <ChangelogInput onSubmit={handleGenerate} isLoading={isLoading} error={error} />
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {error ? 'Analyzing commits...' : 'Generating changelog...'}
            </p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <>
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Step 2: Preview & Download
                </h2>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
              <ChangelogPreview
                changelog={result.changelog}
                statistics={result.statistics}
                commitCount={result.commit_count}
              />
            </section>
          </>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">
              Paste a commit log or provide a GitHub repository URL
            </p>
            <p className="text-sm">
              Supports conventional commits and freeform messages
            </p>
          </div>
        )}
      </div>
    </ToolPageTemplate>
  );
}
