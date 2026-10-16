import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function LessonLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 animate-pulse">
      {/* ─── Breadcrumb Skeleton ─── */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <span className="text-muted/40">›</span>
        <Skeleton className="h-4 w-16" />
        <span className="text-muted/40">›</span>
        <Skeleton className="h-4 w-20" />
        <span className="text-muted/40">›</span>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* ─── Two-column layout ─── */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-10 lg:gap-12">
        {/* Main column */}
        <div className="w-full max-w-[68ch] mx-auto lg:mx-0 flex-1 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            {/* Meta row */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-sm" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </div>

            {/* Summary */}
            <div className="border-l-2 border-line pl-4 space-y-2 py-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Cover image */}
            <Skeleton className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-md" />
          </div>

          {/* Body paragraphs */}
          <div className="space-y-6 pt-4">
            <Skeleton className="h-8 w-1/2 pt-4" />
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-4/5" />
            </div>

            {/* Blockquote skeleton */}
            <div className="border-l-4 border-seal/30 bg-card/60 p-4 rounded-r-md space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <Skeleton className="h-8 w-2/5 pt-4" />
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-9/12" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-6">
          <Card className="p-5 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2 pt-2 border-l border-line pl-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
