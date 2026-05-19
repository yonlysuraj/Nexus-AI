export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 animate-fade-in">
        <h1 className="text-6xl font-bold gradient-text">⚡ NexusAI</h1>
        <p className="text-xl text-foreground-secondary max-w-lg mx-auto">
          10 free, open-source AI tools in one beautiful platform.
        </p>
        <div className="flex gap-4 justify-center">
          <span className="px-3 py-1 rounded-full text-sm bg-category-dev/10 text-category-dev border border-category-dev/20">
            🛠️ Dev Tools
          </span>
          <span className="px-3 py-1 rounded-full text-sm bg-category-content/10 text-category-content border border-category-content/20">
            📝 Content
          </span>
          <span className="px-3 py-1 rounded-full text-sm bg-category-productivity/10 text-category-productivity border border-category-productivity/20">
            🎯 Productivity
          </span>
        </div>
        <p className="text-foreground-muted text-sm mt-8">
          Dashboard coming soon — scaffolding complete ✅
        </p>
      </div>
    </main>
  );
}
