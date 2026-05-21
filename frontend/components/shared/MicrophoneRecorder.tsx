'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';

interface MicrophoneRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isLoading?: boolean;
}

export function MicrophoneRecorder({ onRecordingComplete, isLoading = false }: MicrophoneRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if browser supports Web Audio API
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext || !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        onRecordingComplete(audioBlob);
        setDuration(0);
      };

      mediaRecorder.onerror = (event: any) => {
        setError(`Recording error: ${event.error}`);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setDuration(seconds);
        
        // Stop if recording exceeds 1 hour
        if (seconds >= 3600) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access microphone. Please check permissions.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900 dark:text-yellow-200">
            Microphone Recording Not Supported
          </p>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
            Your browser doesn&apos;t support microphone recording. Please use Chrome, Firefox, Safari, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            <Square className="w-5 h-5" />
            Stop Recording
          </button>
        )}

        {/* Duration Display */}
        {(isRecording || duration > 0) && (
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="font-mono text-lg font-medium text-gray-900 dark:text-white">
              {formatTime(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Info Text */}
      {!isRecording && duration === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click to start recording from your microphone (max 1 hour)
        </p>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-pulse" />
          Recording...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-200">Recording Error</p>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Browser Compatibility Note */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Note: Microphone recording requires HTTPS in production. Works on localhost.
      </p>
    </div>
  );
}
