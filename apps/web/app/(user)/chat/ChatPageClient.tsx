'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChatContainer } from '@/features/ai/components/ChatContainer';

export function ChatPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonId = searchParams.get('lessonId') ?? undefined;

  const handleClearLessonScope = () => {
    router.replace('/chat');
  };

  return (
    <ChatContainer
      lessonId={lessonId}
      onClearLessonScope={handleClearLessonScope}
    />
  );
}
