export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-32 bg-muted border-[3px] border-border rounded-sm"></div>
        <div className="h-10 w-24 bg-muted border-[3px] border-border rounded-sm"></div>
      </div>

      {/* Chart Skeleton */}
      <section className="mb-10 flex justify-center">
        <div className="h-[250px] w-full sm:w-[350px] border-[3px] border-border bg-card shadow-[8px_8px_0px_0px_var(--foreground)] rounded-sm flex items-center justify-center">
          <div className="h-32 w-32 rounded-full border-8 border-muted"></div>
        </div>
      </section>

      {/* Courses Skeleton */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-20 bg-muted border-[3px] border-border rounded-sm"></div>
          <div className="h-10 w-32 bg-muted border-[3px] border-border rounded-sm"></div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="h-4 w-24 mb-3 bg-muted rounded-sm"></div>
            <ul className="grid gap-4 sm:grid-cols-2">
              <li className="h-[140px] rounded-sm bg-card border-[3px] border-border shadow-[4px_4px_0px_0px_var(--foreground)]"></li>
              <li className="h-[140px] rounded-sm bg-card border-[3px] border-border shadow-[4px_4px_0px_0px_var(--foreground)]"></li>
            </ul>
          </div>
          <div>
            <div className="h-4 w-24 mb-3 bg-muted rounded-sm"></div>
            <ul className="grid gap-4 sm:grid-cols-2">
              <li className="h-[140px] rounded-sm bg-card border-[3px] border-border shadow-[4px_4px_0px_0px_var(--foreground)]"></li>
              <li className="h-[140px] rounded-sm bg-card border-[3px] border-border shadow-[4px_4px_0px_0px_var(--foreground)]"></li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
