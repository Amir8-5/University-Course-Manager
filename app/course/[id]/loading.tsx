export default function CourseLoading() {
  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6 animate-pulse">
      {/* Back Link Skeleton */}
      <div className="h-4 w-24 rounded-sm bg-muted mb-6 border-[2px] border-transparent"></div>

      {/* Course Meta Skeleton */}
      <div className="mt-6 mb-8 flex flex-col gap-6 border-[3px] border-foreground bg-card p-8 shadow-[8px_8px_0_0_var(--foreground)] sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="h-5 w-20 bg-muted mb-2 rounded-sm border-[2px] border-transparent"></div>
            <div className="h-10 w-full max-w-xs border-[3px] border-foreground bg-background"></div>
          </div>
          <div>
            <div className="h-5 w-16 bg-muted mt-4 mb-2 rounded-sm border-[2px] border-transparent"></div>
            <div className="h-12 w-full max-w-xl border-[3px] border-foreground bg-background"></div>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <div className="h-5 w-12 bg-muted mb-2 rounded-sm border-[2px] border-transparent"></div>
              <div className="h-10 w-full border-[3px] border-foreground bg-background"></div>
            </div>
            <div>
              <div className="h-5 w-24 bg-muted mb-2 rounded-sm border-[2px] border-transparent"></div>
              <div className="h-10 w-full border-[3px] border-foreground bg-background"></div>
            </div>
          </div>
        </div>
        <div className="h-12 w-36 border-[3px] border-foreground bg-muted shrink-0 rounded-sm"></div>
      </div>

      {/* Tests and Assignments Skeleton */}
      <section className="mt-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-64 bg-muted border-b-4 border-primary rounded-sm border-[2px] border-transparent"></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-10 w-32 border-[3px] border-foreground bg-card rounded-sm text-transparent">-</div>
            <div className="h-10 w-36 border-[3px] border-foreground bg-card rounded-sm text-transparent">-</div>
            <div className="h-10 w-28 border-[3px] border-foreground bg-card rounded-sm text-transparent">-</div>
          </div>
        </div>

        <div className="h-64 border-[3px] border-foreground bg-card shadow-[8px_8px_0_0_var(--foreground)] mt-4"></div>

        {/* Grade Summary Skeleton */}
        <div className="h-32 mt-8 border-[3px] border-foreground bg-muted p-6 shadow-[8px_8px_0_0_var(--foreground)]">
          <div className="h-8 w-64 bg-background mb-4 rounded-sm border-[2px] border-transparent"></div>
          <div className="h-4 w-full max-w-lg bg-background rounded-sm border-[2px] border-transparent"></div>
        </div>
      </section>
    </main>
  );
}
