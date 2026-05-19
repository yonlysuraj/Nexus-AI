"use client";

import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  onFiles: (files: File[]) => void;
  accept?: Accept;
  maxSize?: number;
  multiple?: boolean;
  hint?: string;
  className?: string;
};

export function FileUpload({
  onFiles,
  accept,
  maxSize,
  multiple = false,
  hint,
  className,
}: FileUploadProps) {
  const handleDrop = useCallback(
    (files: File[]) => {
      onFiles(files);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/60 px-6 py-10 text-center text-sm text-foreground-secondary transition-default",
        isDragActive
          ? "border-accent-primary/70 bg-accent-primary/10 text-foreground"
          : "hover:border-accent-secondary/60 hover:text-foreground",
        className
      )}
    >
      <input {...getInputProps()} />
      <p className="text-base font-medium">Drop a file here</p>
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
        or click to browse
      </p>
      {hint ? <p className="text-xs text-foreground-muted">{hint}</p> : null}
    </div>
  );
}
