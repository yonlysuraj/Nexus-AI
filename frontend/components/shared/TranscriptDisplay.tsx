'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface TranscriptDisplayProps {
  transcript: string;
  language: string;
  duration: number;
  confidence: number;
}

export function TranscriptDisplay({
  transcript,
  language,
  duration,
  confidence,
}: TranscriptDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong = transcript.length > 500;
  const displayText = isExpanded ? transcript : transcript.substring(0, 500);
  const shouldShowToggle = isLong;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transcript</h3>
        <CopyButton text={transcript} />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400">Duration</p>
          <p className="font-medium text-gray-900 dark:text-white">{duration.toFixed(1)}s</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400">Language</p>
          <p className="font-medium text-gray-900 dark:text-white uppercase">{language}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-gray-600 dark:text-gray-400">Confidence</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Transcript Text */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
          {displayText}
          {!isExpanded && isLong && '...'}
        </pre>
      </div>

      {/* Toggle Button */}
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show More
            </>
          )}
        </button>
      )}
    </div>
  );
}
