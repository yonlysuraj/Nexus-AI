'use client';

import { useState } from 'react';
import { AlertCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface YouTubeInputProps {
  onSubmit: (data: { youtubeUrl: string; seoKeywords?: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function YouTubeInput({ onSubmit, isLoading = false, error }: YouTubeInputProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [videoPreviewId, setVideoPreviewId] = useState<string | null>(null);

  // Extract video ID from URL for preview
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const videoId = extractVideoId(url);
    setVideoPreviewId(videoId);
  };

  const handleTryExample = () => {
    handleUrlChange('https://www.youtube.com/watch?v=M576WGiDBdQ');
  };

  const handleSubmit = () => {
    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      alert('Invalid YouTube URL. Please use youtube.com/watch?v=... or youtu.be/...');
      return;
    }

    onSubmit({
      youtubeUrl,
      seoKeywords: seoKeywords.trim() || undefined,
    });
  };

  useKeyboardShortcut(handleSubmit, isLoading || !youtubeUrl.trim());

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-semibold text-foreground">
            YouTube URL
          </label>
          <button
            onClick={handleTryExample}
            disabled={isLoading}
            className="text-xs font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
          >
            Try Example
          </button>
        </div>
        <p className="text-xs text-foreground-muted mb-3">
          Paste a YouTube video URL (youtube.com, youtu.be, or youtube.com/embed)
        </p>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={isLoading}
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          className={cn(
            "w-full px-4 py-2 rounded-xl border border-border bg-background/70 text-sm text-foreground",
            "placeholder:text-foreground-muted transition-default",
            "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />
      </div>

      {/* Video Preview */}
      {videoPreviewId && (
        <div className="bg-background-tertiary/50 rounded-xl overflow-hidden border border-border">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoPreviewId}`}
              title="YouTube video preview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* SEO Keywords Input */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          SEO Keywords (Optional)
        </label>
        <p className="text-xs text-foreground-muted mb-3">
          Comma-separated keywords to optimize for (e.g., &quot;AI, machine learning, tutorial&quot;)
        </p>
        <input
          type="text"
          value={seoKeywords}
          onChange={(e) => setSeoKeywords(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., Python, web development, coding tutorial"
          className={cn(
            "w-full px-4 py-2 rounded-xl border border-border bg-background/70 text-sm text-foreground",
            "placeholder:text-foreground-muted transition-default",
            "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !youtubeUrl.trim()}
        className={cn(
          "w-full rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-default sm:w-auto flex items-center justify-center gap-2",
          "bg-gradient-to-r from-accent-primary to-accent-secondary",
          (!isLoading && youtubeUrl.trim())
            ? "hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/20"
            : "cursor-not-allowed opacity-50"
        )}
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Generating Blog Post...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Generate Blog Post
          </>
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

      {/* Info Box */}
      <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-xl p-4">
        <p className="text-sm text-accent-primary">
          <strong className="font-semibold">Tip:</strong> Videos with captions will generate faster. If no captions are available, we&apos;ll automatically extract the audio and transcribe it.
        </p>
      </div>
    </div>
  );
}
