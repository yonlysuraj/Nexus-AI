'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { TestGeneratorInput } from '@/components/shared/TestGeneratorInput';
import { TestCodeDisplay } from '@/components/shared/TestCodeDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { downloadTestFile } from '@/lib/testExport';

interface TestGenerationResult {
  test_code: string;
  functions_found: number;
  edge_cases_covered: number;
  framework_used: string;
  language_used: string;
}

export default function UnitTestGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestGenerationResult | null>(null);
  const [currentFramework, setCurrentFramework] = useState<string>('pytest');
  const [currentLanguage, setCurrentLanguage] = useState<string>('python');

  const handleGenerate = async (data: {
    code: string;
    language: string;
    framework: string;
    detailLevel: 'basic' | 'comprehensive';
  }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentFramework(data.framework);
    setCurrentLanguage(data.language);

    try {
      const response = await fetch('/api/v1/test-generator/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          language: data.language,
          framework: data.framework,
          detail_level: data.detailLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Request failed: ${response.statusText}`);
      }

      const result: TestGenerationResult = await response.json();
      setResult(result);
      toast.success('Tests generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate tests';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadTestFile(result.test_code, currentFramework, currentLanguage);
    toast.success(`Downloaded as ${currentLanguage} file`);
  };

  return (
    <ToolPageTemplate
      title="Unit Test Generator"
      description="Generate comprehensive unit tests with edge cases automatically"
      icon="🧪"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Step 1: Enter Code
          </h2>
          <TestGeneratorInput
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
              Analyzing code and generating tests...
            </p>
          </div>
        )}

        {/* Results Section */}
        {result && (
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
            <TestCodeDisplay
              testCode={result.test_code}
              language={result.language_used}
              framework={result.framework_used}
              functionCount={result.functions_found}
              edgeCasesCount={result.edge_cases_covered}
            />
          </section>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">
              Paste your code above to get started
            </p>
            <p className="text-sm">
              Supports Python, JavaScript, TypeScript, and Java with multiple test frameworks
            </p>
          </div>
        )}
      </div>
    </ToolPageTemplate>
  );
}
