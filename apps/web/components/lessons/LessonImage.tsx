'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { optimizeCloudinaryUrl } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface LessonImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function LessonImage({ src, alt, className }: LessonImageProps) {
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = src ? optimizeCloudinaryUrl(src, 1200) : null;
  const showFallback = !optimizedSrc || hasError;

  return (
    <div
      className={cn(
        'relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-md border border-line bg-card shadow-card select-none',
        className
      )}
    >
      {/* Fallback placeholder (always rendered behind image or shown on error) */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center bg-paper text-muted/60 p-4 transition-opacity',
          showFallback ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden={!showFallback}
      >
        <BookOpen size={40} className="text-muted/50 mb-2" aria-hidden="true" />
        <span className="text-[13px] font-serif text-muted">Tư liệu lịch sử</span>
      </div>

      {optimizedSrc && !hasError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizedSrc}
          alt={alt}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          ref={(node) => {
            if (node && node.complete && node.naturalWidth === 0) {
              setHasError(true);
            }
          }}
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        />
      )}
    </div>
  );
}
