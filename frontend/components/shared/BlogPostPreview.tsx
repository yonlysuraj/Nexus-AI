'use client';

import ReactMarkdown from 'react-markdown';
import { CopyButton } from './CopyButton';

interface BlogPostMetadata {
  title: string;
  metaDescription: string;
  keywords: string[];
  wordCount: number;
  readingTime: number;
}

interface BlogPostPreviewProps {
  blogPost: string;
  metadata: BlogPostMetadata;
  transcriptSource: 'captions' | 'yt-dlp' | 'whisper';
}

export function BlogPostPreview({
  blogPost,
  metadata,
  transcriptSource,
}: BlogPostPreviewProps) {
  const getSourceLabel = (source: string): { label: string; color: string } => {
    const sources: Record<string, { label: string; color: string }> = {
      captions: { label: '⚡ From Captions', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' },
      'yt-dlp': { label: '🎥 Extracted Video', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
      whisper: { label: '🎙️ Transcribed Audio', color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' },
    };
    return sources[source] || { label: 'Unknown', color: 'bg-gray-100' };
  };

  const sourceInfo = getSourceLabel(transcriptSource);

  return (
    <div className="space-y-6">
      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Reading Time</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {metadata.readingTime} min
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Word Count</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {metadata.wordCount}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Keywords</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {metadata.keywords.length}
          </p>
        </div>

        <div className={`rounded-lg p-4 border ${sourceInfo.color}`}>
          <p className="text-sm font-medium">{sourceInfo.label}</p>
        </div>
      </div>

      {/* SEO Preview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔍 Search Engine Preview
        </h3>
        <div className="border border-gray-300 dark:border-gray-600 rounded p-4 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-blue-600 dark:text-blue-400 text-lg font-semibold mb-1 truncate">
            {metadata.title}
          </h2>
          <p className="text-green-700 dark:text-green-400 text-sm mb-2">
            example.com › blog › article
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
            {metadata.metaDescription}
          </p>
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🏷️ Target Keywords
        </h3>
        <div className="flex flex-wrap gap-2">
          {metadata.keywords.map((keyword) => (
            <span
              key={keyword}
              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full text-sm font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Blog Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📝 Blog Post
          </h2>
          <CopyButton text={blogPost} />
        </div>

        <div className="prose dark:prose-invert max-w-none overflow-x-auto">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-4 mb-2" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-3 mb-2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-2 mb-1" {...props} />,
              p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 my-2 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 my-2 space-y-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 my-2 space-y-1" {...props} />
              ),
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              code: ({ node, ...props }) => (
                <code
                  className="rounded bg-gray-100 px-1 font-mono text-sm dark:bg-gray-700"
                  {...props}
                />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 text-gray-600 dark:text-gray-400 italic" {...props} />
              ),
            }}
          >
            {blogPost}
          </ReactMarkdown>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">💡 Tips for Publishing</h4>
        <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
          <li>Copy and paste into your blogging platform</li>
          <li>Review and edit the content for your voice/brand</li>
          <li>Use the meta description for your SEO title tag</li>
          <li>Naturally incorporate the keywords throughout</li>
          <li>Add images to each section for better engagement</li>
          <li>Include internal and external links where relevant</li>
        </ul>
      </div>
    </div>
  );
}
