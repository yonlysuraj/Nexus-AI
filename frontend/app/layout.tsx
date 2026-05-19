import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusAI — AI-Powered Productivity Toolkit",
  description:
    "10 free, open-source AI tools in one beautiful platform. Generate READMEs, summarize webpages, convert voice to tasks, optimize resumes, and more.",
  keywords: [
    "AI tools",
    "productivity",
    "open source",
    "README generator",
    "code explainer",
    "resume optimizer",
  ],
  authors: [{ name: "NexusAI Contributors" }],
  openGraph: {
    title: "NexusAI — AI-Powered Productivity Toolkit",
    description:
      "10 free, open-source AI tools in one beautiful platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
