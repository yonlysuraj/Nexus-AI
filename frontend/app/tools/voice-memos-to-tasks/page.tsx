'use client';

import { useState } from 'react';
import { Download, FileJson } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { AudioUpload } from '@/components/shared/AudioUpload';
import { MicrophoneRecorder } from '@/components/shared/MicrophoneRecorder';
import { TranscriptDisplay } from '@/components/shared/TranscriptDisplay';
import { TaskList } from '@/components/shared/TaskList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { OutputCard } from '@/components/shared/OutputCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  exportTasksAsMarkdown,
  exportTasksAsJSON,
  downloadAsFile,
  generateFilename,
} from '@/lib/taskExport';
import { cn } from '@/lib/utils';

interface Task {
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category?: string;
  time_estimate?: string;
  notes?: string;
  depends_on?: string;
}

interface ProcessedResult {
  transcript: string;
  language: string;
  duration: number;
  confidence: number;
  tasks: Task[];
  summary: string;
}

export default function VoiceMemosPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [extractionMode, setExtractionMode] = useState<'structured' | 'detailed' | 'minimal'>(
    'structured'
  );

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const file = new File([audioBlob], `voice-memo-${timestamp}.webm`, {
      type: 'audio/webm',
    });
    setSelectedFile(file);
    setUploadError(null);
    toast.success('Recording saved. Processing audio...');
    processAudio(file);
  };

  const processAudio = async (file: File) => {
    setIsLoading(true);
    setUploadError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extraction_mode', extractionMode);

      const response = await fetch('/api/v1/voice-memo-tasks', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Upload failed: ${response.statusText}`);
      }

      const data: ProcessedResult = await response.json();
      setResult(data);
      toast.success('Voice memo processed successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process audio';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }
    await processAudio(selectedFile);
  };

  const handleExportMarkdown = () => {
    if (!result) return;

    const markdown = exportTasksAsMarkdown(result.tasks, {
      transcript: result.transcript,
      summary: result.summary,
      language: result.language,
      duration: result.duration,
      confidence: result.confidence,
      timestamp: new Date().toISOString(),
    });

    downloadAsFile(markdown, generateFilename('md'));
    toast.success('Exported as Markdown');
  };

  const handleExportJSON = () => {
    if (!result) return;

    const json = exportTasksAsJSON(result.tasks, {
      transcript: result.transcript,
      summary: result.summary,
      language: result.language,
      duration: result.duration,
      confidence: result.confidence,
      timestamp: new Date().toISOString(),
    });

    downloadAsFile(json, generateFilename('json'));
    toast.success('Exported as JSON');
  };

  return (
    <AppShell>
      <ToolPageTemplate
        title="Voice Memos to Tasks"
        description="Convert audio recordings into structured task lists with priorities and categories"
      >
        <div className="space-y-6">
          {/* Input Section */}
          <section className="space-y-6 rounded-2xl border border-border bg-background-secondary/50 p-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 1: Upload or Record Audio
              </h2>
            </div>

            <div className="space-y-8">
              {/* Extraction Mode Selector */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Task Extraction Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'structured', label: 'Structured', desc: 'Priority, category, time' },
                    { id: 'detailed', label: 'Detailed', desc: 'With notes & dependencies' },
                    { id: 'minimal', label: 'Minimal', desc: 'Description & priority' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() =>
                        setExtractionMode(mode.id as 'structured' | 'detailed' | 'minimal')
                      }
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-default",
                        extractionMode === mode.id
                          ? "border-accent-primary bg-accent-primary/10 shadow-sm shadow-accent-primary/10 text-accent-primary"
                          : "border-border bg-background/50 hover:border-accent-primary/40 hover:bg-background/80 text-foreground"
                      )}
                    >
                      <p className="font-semibold text-sm">
                        {mode.label}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        extractionMode === mode.id ? "text-accent-primary/80" : "text-foreground-muted"
                      )}>
                        {mode.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-background-tertiary/50 border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Upload Audio File
                </h3>
                <AudioUpload
                  onFileSelect={handleFileSelect}
                  isLoading={isLoading}
                  error={uploadError}
                />

                {selectedFile && !result && (
                  <button
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className={cn(
                      "mt-5 w-full rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-default sm:w-auto",
                      "bg-gradient-to-r from-accent-primary to-accent-secondary",
                      !isLoading
                        ? "hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/20"
                        : "cursor-not-allowed opacity-50"
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Processing...
                      </span>
                    ) : (
                      'Process Audio'
                    )}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-background-secondary text-foreground-muted font-medium">
                    OR
                  </span>
                </div>
              </div>

              {/* Microphone Section */}
              <div className="bg-background-tertiary/50 border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Record from Microphone
                </h3>
                <MicrophoneRecorder
                  onRecordingComplete={handleRecordingComplete}
                  isLoading={isLoading}
                />
              </div>
            </div>
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
                  <LoadingSpinner label="Processing your audio... This may take a minute." />
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <OutputCard
                  title="Step 2: Extracted Tasks & Transcript"
                  actions={
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportJSON}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-secondary/60 hover:text-accent-secondary flex items-center gap-2"
                        title="Export as JSON"
                      >
                        <FileJson className="w-4 h-4" />
                        JSON
                      </button>
                      <button
                        onClick={handleExportMarkdown}
                        className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-default hover:border-accent-primary/60 hover:text-accent-primary flex items-center gap-2"
                        title="Export as Markdown"
                      >
                        <Download className="w-4 h-4" />
                        Markdown
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">Tasks</h3>
                      <TaskList tasks={result.tasks} summary={result.summary} />
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="text-sm font-semibold text-foreground mb-4">Transcript</h3>
                      <TranscriptDisplay
                        transcript={result.transcript}
                        language={result.language}
                        duration={result.duration}
                        confidence={result.confidence}
                      />
                    </div>
                  </div>
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
                  title="Upload or record audio to begin"
                  description="Supported formats: mp3, wav, m4a, flac, ogg (max 25MB). You can also record directly from your microphone."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ToolPageTemplate>
    </AppShell>
  );
}
