"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyButton({ text, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "rounded-full border border-border/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-default",
        copied
          ? "border-accent-primary/60 text-accent-primary"
          : "hover:border-accent-secondary/60 hover:text-accent-secondary",
        className
      )}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
