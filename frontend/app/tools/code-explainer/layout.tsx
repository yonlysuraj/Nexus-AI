import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Codebase Explainer — NexusAI",
  description:
    "Explain code at beginner, intermediate, or advanced depth with AI-powered analysis and structure.",
};

export default function CodeExplainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
