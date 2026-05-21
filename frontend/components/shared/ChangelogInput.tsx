'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

type InputMode = 'paste' | 'repo';

interface ChangelogInputProps {
  onSubmit: (data: { mode: 'paste' | 'repo'; value: string; branch?: string }) => void;
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
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setMode('paste')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            mode === 'paste'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Paste Commit Log
        </button>
        <button
          onClick={() => setMode('repo')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            mode === 'repo'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          GitHub Repository
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {mode === 'paste' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commit Log
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Paste output from: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">git log --oneline</code>
            </p>
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              disabled={isLoading}
              placeholder={`abc1234 Initial commit\ndef5678 Add feature\ngh9012 Fix bug`}
              className="w-full h-48 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 font-mono text-sm"
            />
          </div>
        )}

        {mode === 'repo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
                placeholder="https://github.com/user/repository"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Enter HTTPS URL only (SSH not supported)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isLoading}
                placeholder="main"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || (!pasteValue.trim() && mode === 'paste') || (!repoUrl.trim() && mode === 'repo')}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          'Generate Changelog'
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-200">Error</p>
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
