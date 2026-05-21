"use client";

import { cn } from "@/lib/utils";

type DownloadButtonProps = {
  content: string;
  fileName: string;
  mimeType?: string;
  label?: string;
  className?: string;
};

export function DownloadButton({
  content,
  fileName,
  mimeType = "text/plain",
  label = "Download",
  className,
}: DownloadButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={cn(
        "rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default",
        "hover:border-accent-primary/60 hover:text-accent-primary",
        className
      )}
    >
      {label}
    </button>
  );
}
