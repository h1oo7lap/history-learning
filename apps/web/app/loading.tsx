import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 space-y-16">
      {/* ─── Hero Skeleton ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-12 w-3/5" />
          <Skeleton className="h-5 w-full mt-4" />
          <Skeleton className="h-5 w-4/5" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-36 rounded-md" />
            <Skeleton className="h-12 w-32 rounded-md" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <Card className="p-3">
            <Skeleton className="aspect-[16/10] w-full rounded-sm" />
            <div className="space-y-2 mt-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Chọn lớp Skeleton ─── */}
      <section className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-10 rounded-md" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Bài học mới Skeleton ─── */}
      <section className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
