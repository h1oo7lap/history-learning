'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createQueryClient } from '@/lib/query-client';
import { Toaster } from 'sonner';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      {children}
      <Toaster position="top-right" richColors duration={4000} />
    </QueryClientProvider>
  );
}
