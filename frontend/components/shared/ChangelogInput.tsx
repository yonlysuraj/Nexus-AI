'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputMode = 'paste' | 'repo';

interface ChangelogInputProps {
  onSubmit: (data: { mode: InputMode; value: string; branch?: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ChangelogInput({ onSubmit, isLoading = false, error }: ChangelogInputProps) {
  const [mode, setMode] = useState<InputMode>('paste');
  const [pasteValue, setPasteValue] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');

  const handleSubmit = () => {
    if (mode === 'paste') {
      if (!pasteValue.trim()) {
        alert('Please paste a commit log');
        return;
      }
      onSubmit({ mode: 'paste', value: pasteValue });
    } else {
      if (!repoUrl.trim()) {
        alert('Please enter a repository URL');
        return;
      }
      onSubmit({ mode: 'repo', value: repoUrl, branch });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setMode('paste')}
          className={cn(
            "px-2 py-2 text-sm font-semibold transition-colors border-b-2",
            mode === 'paste'
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-foreground-secondary hover:text-foreground hover:border-border"
          )}
        >
          Paste Commit Log
        </button>
        <button
          onClick={() => setMode('repo')}
          className={cn(
            "px-2 py-2 text-sm font-semibold transition-colors border-b-2",
            mode === 'repo'
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-foreground-secondary hover:text-foreground hover:border-border"
          )}
        >
          GitHub Repository
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {mode === 'paste' && (
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Commit Log
            </label>
            <p className="text-xs text-foreground-muted mb-3">
              Paste output from: <code className="bg-background-tertiary px-1.5 py-0.5 rounded text-foreground-secondary font-mono">git log --oneline</code>
            </p>
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              disabled={isLoading}
              placeholder="abc1234 Initial commit\ndef5678 Add feature\ngh9012 Fix bug"
              className={cn(
                "w-full h-48 px-4 py-3 rounded-xl border border-border bg-background/70 font-mono text-sm leading-relaxed text-foreground",
                "placeholder:text-foreground-muted transition-default",
                "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            />
          </div>
        )}

        {mode === 'repo' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Repository URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
                placeholder="https://github.com/user/repository"
                className={cn(
                  "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground",
                  "placeholder:text-foreground-muted transition-default",
                  "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              />
              <p className="text-xs text-foreground-muted mt-2">
                Enter HTTPS URL only (SSH not supported)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isLoading}
                placeholder="main"
                className={cn(
                  "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground",
                  "placeholder:text-foreground-muted transition-default",
                  "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || (!pasteValue.trim() && mode === 'paste') || (!repoUrl.trim() && mode === 'repo')}
        className={cn(
          "w-full rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-default sm:w-auto",
          "bg-gradient-to-r from-accent-primary to-accent-secondary",
          (!isLoading && ((pasteValue.trim() && mode === 'paste') || (repoUrl.trim() && mode === 'repo')))
            ? "hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/20"
            : "cursor-not-allowed opacity-50"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Processing...
          </span>
        ) : (
          'Generate Changelog'
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-error">Error</p>
            <p className="text-sm text-error/80 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
