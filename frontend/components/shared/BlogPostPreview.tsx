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
      captions: { label: '⚡ From Captions', color: 'bg-success/10 border-success/30 text-success' },
      'yt-dlp': { label: '🎥 Extracted Video', color: 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' },
      whisper: { label: '🎙️ Transcribed Audio', color: 'bg-warning/10 border-warning/30 text-warning' },
    };
    return sources[source] || { label: 'Unknown', color: 'bg-background-secondary border-border text-foreground-muted' };
  };

  const sourceInfo = getSourceLabel(transcriptSource);

  return (
    <div className="space-y-6">
      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-accent-secondary/10 rounded-xl p-4 border border-accent-secondary/30">
          <p className="text-sm text-accent-secondary">Reading Time</p>
          <p className="text-2xl font-bold text-foreground">
            {metadata.readingTime} min
          </p>
        </div>

        <div className="bg-accent-primary/10 rounded-xl p-4 border border-accent-primary/30">
          <p className="text-sm text-accent-primary">Word Count</p>
          <p className="text-2xl font-bold text-foreground">
            {metadata.wordCount}
          </p>
        </div>

        <div className="bg-success/10 rounded-xl p-4 border border-success/30">
          <p className="text-sm text-success">Keywords</p>
          <p className="text-2xl font-bold text-foreground">
            {metadata.keywords.length}
          </p>
        </div>

        <div className={`rounded-xl p-4 border ${sourceInfo.color} flex items-center justify-center`}>
          <p className="text-sm font-semibold">{sourceInfo.label}</p>
        </div>
      </div>

      {/* SEO Preview */}
      <div className="bg-background-tertiary/50 border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span>🔍</span> Search Engine Preview
        </h3>
        <div className="border border-border rounded-lg p-5 bg-background/50">
          <h2 className="text-accent-primary text-lg font-semibold mb-1 truncate">
            {metadata.title}
          </h2>
          <p className="text-success text-sm mb-2 font-mono">
            example.com › blog › article
          </p>
          <p className="text-foreground-secondary text-sm leading-relaxed line-clamp-2">
            {metadata.metaDescription}
          </p>
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-background-tertiary/50 border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span>🏷️</span> Target Keywords
        </h3>
        <div className="flex flex-wrap gap-2">
          {metadata.keywords.map((keyword) => (
            <span
              key={keyword}
              className="px-3 py-1 bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary rounded-full text-xs font-semibold uppercase tracking-wide"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Blog Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>📝</span> Blog Post
          </h3>
          <CopyButton text={blogPost} />
        </div>

        <div className="prose prose-sm prose-invert max-w-none rounded-xl border border-border bg-background-tertiary/50 p-6 overflow-x-auto text-foreground">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-3 text-foreground" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-3 mb-2 text-foreground" {...props} />,
              p: ({ node, ...props }) => <p className="text-foreground-secondary my-3 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside text-foreground-secondary my-3 space-y-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside text-foreground-secondary my-3 space-y-1" {...props} />
              ),
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              code: ({ node, ...props }) => (
                <code
                  className="rounded bg-background-secondary px-1.5 py-0.5 font-mono text-xs text-foreground"
                  {...props}
                />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-border pl-4 my-3 text-foreground-muted italic" {...props} />
              ),
            }}
          >
            {blogPost}
          </ReactMarkdown>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-success/10 border border-success/30 rounded-xl p-5">
        <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
          <span>💡</span> Tips for Publishing
        </h4>
        <ul className="text-sm text-foreground-secondary space-y-2 list-disc list-inside leading-relaxed">
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
