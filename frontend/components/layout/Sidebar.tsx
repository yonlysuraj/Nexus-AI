import Link from "next/link";
import { tools } from "@/lib/tools";

const categoryLabels = {
  dev: "Dev Tools",
  content: "Content",
  productivity: "Productivity",
  career: "Career",
  finance: "Finance",
} as const;

const categoryClasses = {
  dev: "text-category-dev border-category-dev/30 bg-category-dev/10",
  content: "text-category-content border-category-content/30 bg-category-content/10",
  productivity: "text-category-productivity border-category-productivity/30 bg-category-productivity/10",
  career: "text-category-career border-category-career/30 bg-category-career/10",
  finance: "text-category-finance border-category-finance/30 bg-category-finance/10",
} as const;

export function Sidebar() {
  const categories = Array.from(
    new Set(tools.map((tool) => tool.category))
  );

  return (
    <aside className="hidden flex-col gap-6 lg:flex">
      <div className="rounded-2xl border border-border bg-background-secondary p-5 shadow-sm">
        <p className="text-sm font-semibold">Tool Categories</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                categoryClasses[category]
              }`}
            >
              {categoryLabels[category]}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background-secondary p-5 shadow-sm">
        <p className="text-sm font-semibold">Quick Links</p>
        <ul className="mt-4 space-y-3 text-sm text-foreground-secondary">
          {tools.slice(0, 6).map((tool) => (
            <li key={tool.id}>
              <Link
                href={tool.href}
                className="transition-default hover:text-foreground"
              >
                {tool.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-background-secondary p-5 text-sm text-foreground-secondary shadow-sm">
        <p className="text-sm font-semibold">Status</p>
        <p className="mt-3">
          Phase 0: Foundation setup in progress. Dashboard and core components
          are ready to wire into the tools.
        </p>
      </div>
    </aside>
  );
}
