"use client";

export function DatabaseSkeleton() {
  return (
    <div className="bg-background relative flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* SIDEBAR SKELETON */}
      <div className="border-border/50 bg-card/30 hidden w-64 border-r p-4 lg:block">
        <div className="bg-muted/50 mb-6 h-8 w-32 animate-pulse rounded-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-muted/50 h-10 w-full animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>

      {/* MAIN CONTENT SKELETON */}
      <div className="flex flex-1 flex-col">
        {/* HEADER */}
        <div className="border-border/50 bg-card/30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-sm">
          <div className="bg-muted/50 h-6 w-48 animate-pulse rounded-full" />
          <div className="bg-muted/50 h-9 w-9 animate-pulse rounded-full" />
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="border-border/50 bg-muted/20 h-40 animate-pulse rounded-2xl border"
              >
                <div className="to-muted/10 h-full w-full bg-linear-to-br from-transparent opacity-50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
