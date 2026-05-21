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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Transcript Content</h3>
        <CopyButton text={transcript} />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-background-tertiary/50 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-1">Duration</p>
          <p className="font-bold text-foreground">{duration.toFixed(1)}s</p>
        </div>
        <div className="bg-background-tertiary/50 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-1">Language</p>
          <p className="font-bold text-foreground uppercase">{language}</p>
        </div>
        <div className="bg-background-tertiary/50 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-1">Confidence</p>
          <p className="font-bold text-foreground">
            {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Transcript Text */}
      <div className="bg-background-secondary/50 rounded-xl p-5 border border-border">
        <pre className="font-mono text-sm text-foreground-secondary whitespace-pre-wrap break-words leading-relaxed">
          {displayText}
          {!isExpanded && isLong && <span className="text-accent-primary">...</span>}
        </pre>
      </div>

      {/* Toggle Button */}
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide text-foreground-muted hover:text-foreground hover:bg-background-secondary/80 rounded-xl transition-default border border-transparent hover:border-border"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 text-accent-primary" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-accent-primary" />
              Show More
            </>
          )}
        </button>
      )}
    </div>
  );
}
