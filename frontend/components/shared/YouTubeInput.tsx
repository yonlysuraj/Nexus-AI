'use client';

import { useState } from 'react';
import { AlertCircle, Play } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          YouTube URL
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Paste a YouTube video URL (youtube.com, youtu.be, or youtube.com/embed)
        </p>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={isLoading}
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
        />
      </div>

      {/* Video Preview */}
      {videoPreviewId && (
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SEO Keywords (Optional)
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Comma-separated keywords to optimize for (e.g., &quot;AI, machine learning, tutorial&quot;)
        </p>
        <input
          type="text"
          value={seoKeywords}
          onChange={(e) => setSeoKeywords(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., Python, web development, coding tutorial"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !youtubeUrl.trim()}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Blog Post...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Generate Blog Post
          </>
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

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Tip:</strong> Videos with captions will generate faster. If no captions are available, we&apos;ll automatically extract the audio and transcribe it.
        </p>
      </div>
    </div>
  );
}
