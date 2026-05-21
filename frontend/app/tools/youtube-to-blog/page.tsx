'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { YouTubeInput } from '@/components/shared/YouTubeInput';
import { BlogPostPreview } from '@/components/shared/BlogPostPreview';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { OutputCard } from '@/components/shared/OutputCard';
import { downloadBlogPost } from '@/lib/blogExport';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogGenerationResult {
  blog_post: string;
  metadata: {
    title: string;
    meta_description: string;
    keywords: string[];
    word_count: number;
    reading_time: number;
  };
  transcript_source: 'captions' | 'yt-dlp' | 'whisper';
}

export default function YouTubeToBlogPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlogGenerationResult | null>(null);
  
  const normalizedMetadata = result
    ? {
        title: result.metadata.title,
        metaDescription: result.metadata.meta_description,
        keywords: result.metadata.keywords,
        wordCount: result.metadata.word_count,
        readingTime: result.metadata.reading_time,
      }
    : null;

  const handleGenerate = async (data: { youtubeUrl: string; seoKeywords?: string }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/v1/youtube-to-blog/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: data.youtubeUrl,
          seo_keywords: data.seoKeywords || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Request failed: ${response.statusText}`);
      }

      const result: BlogGenerationResult = await response.json();
      setResult(result);
      toast.success('Blog post generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate blog post';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadBlogPost(result.blog_post, normalizedMetadata!);
    toast.success('Downloaded as blog post');
  };

  return (
    <AppShell>
      <ToolPageTemplate
        title="YouTube to Blog Post"
        description="Convert YouTube videos into SEO-optimized blog posts automatically"
      >
        <div className="space-y-6">
          {/* Input Section */}
          <section className="space-y-4 rounded-2xl border border-border bg-background-secondary/50 p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 1: Paste YouTube URL
              </h2>
            </div>
            <YouTubeInput
              onSubmit={handleGenerate}
              isLoading={isLoading}
              error={error}
            />
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
                <div className="flex flex-col items-center justify-center">
                  <LoadingSpinner label="Extracting transcript and generating blog post..." />
                  <p className="mt-2 text-sm text-foreground-muted">
                    This may take a few moments if we need to transcribe the video
                  </p>
                </div>
              </motion.div>
            )}

            {result && normalizedMetadata && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OutputCard
                  title="Step 2: Review & Download"
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
                  <BlogPostPreview
                    blogPost={result.blog_post}
                    metadata={normalizedMetadata}
                    transcriptSource={result.transcript_source}
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
                  title="Paste a YouTube URL above to get started"
                  description="Works with any public YouTube video. We'll extract the transcript and convert it to a blog post."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
