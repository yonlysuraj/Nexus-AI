import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LinkedIn Post Writer — NexusAI",
  description:
    "Transform bullet points into polished LinkedIn posts with AI-powered tone control. Professional, casual, or storytelling — choose your voice.",
};

export default function LinkedInWriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
