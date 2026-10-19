import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function QuizCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4 mt-1" />
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="pt-2 border-t border-line/60 flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Skeleton className="h-9 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}
