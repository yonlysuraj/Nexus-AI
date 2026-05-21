"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, FileText, Upload } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";

type ResumeUploadProps = {
  onUpload: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
  resumePreview?: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ResumeUpload({
  onUpload,
  isLoading = false,
  error,
  resumePreview,
}: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = (files: File[]) => {
    const selected = files[0];
    if (!selected) return;

    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) {
      setLocalError("Upload a PDF or DOCX resume.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setLocalError("Keep the resume under 5 MB for reliable parsing.");
      return;
    }

    setLocalError(null);
    setFile(selected);
    onUpload(selected);
  };

  const displayError = error || localError;

  return (
    <div className="space-y-4">
      <FileUpload
        onFiles={handleFiles}
        accept={{
          "application/pdf": [".pdf"],
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
            ".docx",
          ],
        }}
        maxSize={MAX_FILE_SIZE}
        hint="PDF or DOCX, up to 5 MB"
        className={isLoading ? "pointer-events-none opacity-60" : undefined}
      />

      {file ? (
        <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-none text-success" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Resume selected
            </p>
            <p className="truncate text-sm text-foreground-secondary">
              {file.name}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      ) : null}

      {displayError ? (
        <div className="flex items-start gap-3 rounded-xl border border-error/25 bg-error/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-error" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Resume upload issue
            </p>
            <p className="text-sm text-foreground-secondary">{displayError}</p>
          </div>
        </div>
      ) : null}

      {resumePreview ? (
        <div className="rounded-xl border border-border/70 bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-accent-secondary" />
            Resume Preview
          </div>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-border/50 bg-background-tertiary/60 p-3 font-mono text-xs leading-relaxed text-foreground-secondary">
            {resumePreview}
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-3 rounded-xl border border-accent-secondary/25 bg-accent-secondary/10 p-3 text-sm text-foreground-secondary">
        <Upload className="mt-0.5 h-4 w-4 flex-none text-accent-secondary" />
        <p>
          Upload the resume you want compared against the job description.
          Tables and image-heavy resumes may parse less cleanly than text-based
          files.
        </p>
      </div>
    </div>
  );
}
