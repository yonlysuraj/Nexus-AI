'use client';

import { useState } from 'react';
import { Download, FileJson } from 'lucide-react';
import toast from 'react-hot-toast';
import { ToolPageTemplate } from '@/components/shared/ToolPageTemplate';
import { AudioUpload } from '@/components/shared/AudioUpload';
import { MicrophoneRecorder } from '@/components/shared/MicrophoneRecorder';
import { TranscriptDisplay } from '@/components/shared/TranscriptDisplay';
import { TaskList } from '@/components/shared/TaskList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  exportTasksAsMarkdown,
  exportTasksAsJSON,
  downloadAsFile,
  generateFilename,
} from '@/lib/taskExport';

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
    // Convert blob to File
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
    <ToolPageTemplate
      title="Voice Memos to Tasks"
      description="Convert audio recordings into structured task lists with priorities and categories"
      icon="🎤"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Step 1: Upload or Record Audio
          </h2>

          <div className="space-y-6">
            {/* Extraction Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Task Extraction Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
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
                    className={`text-left p-3 rounded-lg border-2 transition-all ${
                      extractionMode === mode.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {mode.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
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
                  className="mt-4 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Process Audio'}
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  OR
                </span>
              </div>
            </div>

            {/* Microphone Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                Record from Microphone
              </h3>
              <MicrophoneRecorder
                onRecordingComplete={handleRecordingComplete}
                isLoading={isLoading}
              />
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Processing your audio... This may take a minute.
            </p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <>
            {/* Transcript */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Step 2: Transcript
              </h2>
              <TranscriptDisplay
                transcript={result.transcript}
                language={result.language}
                duration={result.duration}
                confidence={result.confidence}
              />
            </section>

            {/* Tasks */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Step 3: Extracted Tasks
              </h2>
              <TaskList tasks={result.tasks} summary={result.summary} />
            </section>

            {/* Export Buttons */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Export Results
              </h2>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export as Markdown
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FileJson className="w-5 h-5" />
                  Export as JSON
                </button>
              </div>
            </section>
          </>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Upload an audio file or record from your microphone</p>
            <p className="text-sm">Supported formats: mp3, wav, m4a, flac, ogg (max 25MB)</p>
          </div>
        )}
      </div>
    </ToolPageTemplate>
  );
}
