import { OutputCard } from "./OutputCard";
import { Skeleton } from "./Skeleton";

export function OutputSkeleton() {
  return (
    <OutputCard title="Generating Results..." actions={<Skeleton className="h-8 w-20 rounded-full" />}>
      <div className="space-y-4">
        {/* Mock heading/paragraph block */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        
        {/* Mock badges */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Mock code block or large content area */}
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
      </div>
    </OutputCard>
  );
}
