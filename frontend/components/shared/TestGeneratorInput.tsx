'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Language and framework mapping
const FRAMEWORK_BY_LANGUAGE: Record<string, string[]> = {
  python: ['pytest', 'unittest'],
  javascript: ['jest', 'vitest', 'mocha'],
  typescript: ['jest', 'vitest'],
  java: ['junit4', 'junit5'],
};

interface TestGeneratorInputProps {
  onSubmit: (data: {
    code: string;
    language: string;
    framework: string;
    detailLevel: 'basic' | 'comprehensive';
  }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function TestGeneratorInput({ onSubmit, isLoading = false, error }: TestGeneratorInputProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<string>('python');
  const [framework, setFramework] = useState<string>('pytest');
  const [detailLevel, setDetailLevel] = useState<'basic' | 'comprehensive'>('comprehensive');

  // Update framework when language changes
  useEffect(() => {
    const frameworks = FRAMEWORK_BY_LANGUAGE[language] || ['pytest'];
    setFramework(frameworks[0]);
  }, [language]);

  const handleSubmit = () => {
    if (!code.trim()) {
      alert('Please enter code to generate tests for');
      return;
    }
    onSubmit({ code, language, framework, detailLevel });
  };

  const availableFrameworks = FRAMEWORK_BY_LANGUAGE[language] || [];

  return (
    <div className="space-y-6">
      {/* Code Input */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Code Snippet
        </label>
        <p className="text-xs text-foreground-muted mb-3">
          Paste your function, method, or class here
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isLoading}
          placeholder={`// Python example:\ndef calculate_total(items, tax_rate):\n    """Calculate total with tax."""\n    return sum(items) * (1 + tax_rate)`}
          className={cn(
            "w-full h-64 px-4 py-3 rounded-xl border border-border bg-background/70 font-mono text-sm leading-relaxed text-foreground",
            "placeholder:text-foreground-muted transition-default resize-none",
            "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Language Selector */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            className={cn(
              "w-full px-4 py-2 rounded-xl border border-border bg-background/70 text-sm text-foreground",
              "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
              "disabled:cursor-not-allowed disabled:opacity-60 transition-default"
            )}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
          </select>
        </div>

        {/* Framework Selector */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Framework
          </label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            disabled={isLoading || availableFrameworks.length === 0}
            className={cn(
              "w-full px-4 py-2 rounded-xl border border-border bg-background/70 text-sm text-foreground",
              "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
              "disabled:cursor-not-allowed disabled:opacity-60 transition-default"
            )}
          >
            {availableFrameworks.map((fw) => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>
        </div>

        {/* Detail Level */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Test Detail
          </label>
          <select
            value={detailLevel}
            onChange={(e) => setDetailLevel(e.target.value as 'basic' | 'comprehensive')}
            disabled={isLoading}
            className={cn(
              "w-full px-4 py-2 rounded-xl border border-border bg-background/70 text-sm text-foreground",
              "focus:border-accent-primary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary/30",
              "disabled:cursor-not-allowed disabled:opacity-60 transition-default"
            )}
          >
            <option value="basic">Basic (2-3 tests)</option>
            <option value="comprehensive">Comprehensive (5+ tests)</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !code.trim()}
        className={cn(
          "w-full rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-default sm:w-auto",
          "bg-gradient-to-r from-accent-primary to-accent-secondary",
          (!isLoading && code.trim())
            ? "hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/20"
            : "cursor-not-allowed opacity-50"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Generating Tests...
          </span>
        ) : (
          'Generate Tests'
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
    </div>
  );
}
