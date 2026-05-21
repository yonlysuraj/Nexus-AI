'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { YouTubeInput } from '@/components/shared/YouTubeInput';
import { BlogPostPreview } from '@/components/shared/BlogPostPreview';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { downloadBlogPost } from '@/lib/blogExport';

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
    <ToolPageTemplate
      title="YouTube to Blog Post"
      description="Convert YouTube videos into SEO-optimized blog posts automatically"
      icon="🎬"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Step 1: Paste YouTube URL
          </h2>
          <YouTubeInput
            onSubmit={handleGenerate}
            isLoading={isLoading}
            error={error}
          />
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Extracting transcript and generating blog post...
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              This may take a few moments if we need to transcribe the video
            </p>
          </div>
        )}

        {/* Results Section */}
        {result && normalizedMetadata && (
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 2: Review & Download
              </h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
            <BlogPostPreview
              blogPost={result.blog_post}
              metadata={normalizedMetadata}
              transcriptSource={result.transcript_source}
            />
          </section>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">
              🎥 Paste a YouTube URL above to get started
            </p>
            <p className="text-sm">
              Works with any public YouTube video. We&apos;ll extract the transcript and convert it to a blog post.
            </p>
          </div>
        )}
      </div>
    </ToolPageTemplate>
  );
}
