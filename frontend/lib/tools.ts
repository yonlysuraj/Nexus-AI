export type ToolCategory = "dev" | "content" | "productivity" | "career" | "finance";

export type ToolSummary = {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  href: string;
};

export const tools: ToolSummary[] = [
  {
    id: "readme-generator",
    title: "README Auto-Generator",
    description: "Turn a repo into a crisp README with sections and badges.",
    category: "dev",
    href: "/tools/readme-generator",
  },
  {
    id: "code-explainer",
    title: "Codebase Explainer",
    description: "Explain code at the right depth for any audience.",
    category: "dev",
    href: "/tools/code-explainer",
  },
  {
    id: "unit-test-generator",
    title: "Unit Test Generator",
    description: "Generate tests for functions with edge cases baked in.",
    category: "dev",
    href: "/tools/unit-test-generator",
  },
  {
    id: "linkedin-writer",
    title: "LinkedIn Post Writer",
    description: "Polished posts with a hook, structure, and call to action.",
    category: "content",
    href: "/tools/linkedin-writer",
  },
  {
    id: "webpage-summarizer",
    title: "Webpage Summarizer",
    description: "Get a clean summary with key takeaways and sections.",
    category: "content",
    href: "/tools/webpage-summarizer",
  },
  {
    id: "youtube-blog",
    title: "YouTube to Blog Post",
    description: "Convert a video into an SEO-ready article draft.",
    category: "content",
    href: "/tools/youtube-blog",
  },
  {
    id: "voice-to-tasks",
    title: "Voice Memos to Tasks",
    description: "Turn audio notes into a clean task list.",
    category: "productivity",
    href: "/tools/voice-to-tasks",
  },
  {
    id: "git-changelog",
    title: "Git Changelog Generator",
    description: "Group commits into a clean, readable changelog.",
    category: "productivity",
    href: "/tools/git-changelog",
  },
  {
    id: "resume-optimizer",
    title: "Resume Optimizer",
    description: "Match resumes to job descriptions with clear gaps.",
    category: "career",
    href: "/tools/resume-optimizer",
  },
  {
    id: "receipt-reader",
    title: "Receipt Reader",
    description: "Extract expenses from receipts and categorize them.",
    category: "finance",
    href: "/tools/receipt-reader",
  },
];
