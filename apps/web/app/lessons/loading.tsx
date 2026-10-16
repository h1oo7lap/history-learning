import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function LessonsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      {/* ─── Page Header Skeleton ─── */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      {/* ─── Search & Filter Bar Skeleton ─── */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <Skeleton className="sm:col-span-4 h-11 rounded-sm" />
          <Skeleton className="sm:col-span-3 h-11 rounded-sm" />
          <Skeleton className="sm:col-span-3 h-11 rounded-sm" />
          <Skeleton className="sm:col-span-2 h-11 rounded-sm" />
        </div>
      </Card>

      {/* ─── Results count skeleton ─── */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* ─── Lessons Grid Skeleton ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
