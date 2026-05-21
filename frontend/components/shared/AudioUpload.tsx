'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface AudioUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function AudioUpload({ onFileSelect, isLoading = false, error }: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const SUPPORTED_FORMATS = ['mp3', 'wav', 'm4a', 'flac', 'ogg'];
  const MAX_SIZE_MB = 25;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndSelectFile = (file: File) => {
    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`File too large: ${sizeMB}MB (max: ${MAX_SIZE_MB}MB)`);
      return;
    }

    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
      alert(`Unsupported format: .${ext}. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
      return;
    }

    // Check MIME type
    if (!file.type.startsWith('audio/')) {
      alert('File must be an audio file');
      return;
    }

    // Update state
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setFileSize(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : error
              ? 'border-red-300 bg-red-50 dark:bg-red-950'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-gray-500'
        }`}
      >
        <input
          type="file"
          id="audio-input"
          accept="audio/*"
          onChange={handleFileInput}
          disabled={isLoading}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <label htmlFor="audio-input" className="flex flex-col items-center cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Drag audio file here or click to browse
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Supported: {SUPPORTED_FORMATS.join(', ')} (max {MAX_SIZE_MB}MB)
          </p>
        </label>
      </div>

      {/* File Info */}
      {fileName && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{fileName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{fileSize}</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}

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

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-900 dark:text-blue-200">Processing audio...</p>
        </div>
      )}
    </div>
  );
}
