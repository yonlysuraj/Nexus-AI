'use client';

import ReactMarkdown from 'react-markdown';
import { CopyButton } from './CopyButton';

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
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Commits</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{commitCount}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">New Features</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {categories['feat'] || 0}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400">Bug Fixes</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {categories['fix'] || 0}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Contributors</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {authors.length}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categories).length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Commit Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(categories).map(([type, count]) => (
              <div
                key={type}
                className="bg-gray-50 dark:bg-gray-700 rounded p-3 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {type}
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changelog Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Changelog</h2>
          <CopyButton text={changelog} />
        </div>

        <div className="prose dark:prose-invert max-w-none overflow-x-auto">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-4 mb-2" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-3 mb-2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-2 mb-1" {...props} />,
              p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 my-2" {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 my-2" {...props} />
              ),
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              code: ({ node, ...props }) => (
                <code
                  className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-700"
                  {...props}
                />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 text-gray-600 dark:text-gray-400" {...props} />
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
