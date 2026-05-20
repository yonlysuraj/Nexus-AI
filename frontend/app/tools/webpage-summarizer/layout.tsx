import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webpage Summarizer — NexusAI",
  description:
    "Summarize any webpage into a TL;DR, key points, or detailed summary. AI-powered content extraction and summarization.",
};

export default function WebpageSummarizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
