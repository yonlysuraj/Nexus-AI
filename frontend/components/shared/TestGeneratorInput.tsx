'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Code Snippet
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Paste your function, method, or class here
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isLoading}
          placeholder={`// Python example:
def calculate_total(items, tax_rate):
    """Calculate total with tax."""
    return sum(items) * (1 + tax_rate)`}
          className="w-full h-64 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 font-mono text-sm resize-none"
        />
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
          </select>
        </div>

        {/* Framework Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Framework
          </label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            disabled={isLoading || availableFrameworks.length === 0}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Detail
          </label>
          <select
            value={detailLevel}
            onChange={(e) => setDetailLevel(e.target.value as 'basic' | 'comprehensive')}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
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
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Tests...
          </span>
        ) : (
          'Generate Tests'
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
    </div>
  );
}
