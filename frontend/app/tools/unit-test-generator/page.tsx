'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { TestGeneratorInput } from '@/components/shared/TestGeneratorInput';
import { TestCodeDisplay } from '@/components/shared/TestCodeDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { OutputCard } from '@/components/shared/OutputCard';
import { downloadTestFile } from '@/lib/testExport';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AppShell>
      <ToolPageTemplate
        title="Unit Test Generator"
        description="Generate comprehensive unit tests with edge cases automatically"
      >
        <div className="space-y-6">
          {/* Input Section */}
          <section className="space-y-4 rounded-2xl border border-border bg-background-secondary/50 p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 1: Enter Code
              </h2>
            </div>
            <TestGeneratorInput
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
                <LoadingSpinner label="Analyzing code and generating tests..." />
              </motion.div>
            )}

            {result && (
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
                  <TestCodeDisplay
                    testCode={result.test_code}
                    language={result.language_used}
                    framework={result.framework_used}
                    functionCount={result.functions_found}
                    edgeCasesCount={result.edge_cases_covered}
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
                  title="Paste your code to get started"
                  description="Supports Python, JavaScript, TypeScript, and Java with multiple test frameworks."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
