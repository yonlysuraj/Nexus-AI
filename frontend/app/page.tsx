import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { tools } from "@/lib/tools";

const categoryLabels = {
  dev: "Dev Tools",
  content: "Content",
  productivity: "Productivity",
  career: "Career",
  finance: "Finance",
} as const;

const categoryBadges = {
  dev: "bg-category-dev/10 text-category-dev border-category-dev/30",
  content: "bg-category-content/10 text-category-content border-category-content/30",
  productivity:
    "bg-category-productivity/10 text-category-productivity border-category-productivity/30",
  career: "bg-category-career/10 text-category-career border-category-career/30",
  finance: "bg-category-finance/10 text-category-finance border-category-finance/30",
} as const;

export default function Home() {
  return (
    <AppShell>
      <section className="space-y-8">
        <div className="rounded-3xl border border-border bg-background-secondary/70 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted">
            NexusAI Platform
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-foreground md:text-5xl">
            Build faster with AI tools that feel handcrafted.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-foreground-secondary">
            A focused workspace for 10 AI tools: from README generation to
            resume optimization, with streaming responses and clean exports.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <span
                key={key}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  categoryBadges[key as keyof typeof categoryBadges]
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group rounded-2xl border border-border bg-background-secondary p-6 shadow-sm transition-default hover:-translate-y-1 hover:border-accent-primary/60 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  {categoryLabels[tool.category]}
                </p>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                    categoryBadges[tool.category]
                  }`}
                >
                  {tool.category.toUpperCase()}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground group-hover:text-accent-primary">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                {tool.description}
              </p>
              <div className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent-secondary">
                Open tool
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
