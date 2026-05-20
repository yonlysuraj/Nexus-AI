import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "README Auto-Generator — NexusAI",
  description:
    "Generate professional README.md files from any GitHub repository. Auto-detects tech stack, file structure, and creates polished documentation.",
};

export default function ReadmeGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
