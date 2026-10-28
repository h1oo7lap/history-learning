'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, User, BookOpen, AlertCircle, RotateCcw } from 'lucide-react';
import type { AiSource } from '../api';
import { Button } from '@/components/ui/Button';
import { SafeMarkdown } from '@/lib/safe-markdown';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: AiSource[];
  isError?: boolean;
  errorMessage?: string;
}

interface ChatMessageBubbleProps {
  message: ChatMessageItem;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ChatMessageBubble({
  message,
  onRetry,
  isRetrying = false,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 max-w-3xl ml-auto">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          <div className="bg-card border border-line text-ink rounded-2xl rounded-tr-sm px-4 py-3 shadow-card text-[15px] leading-relaxed break-words">
            {message.content}
          </div>
          <span className="text-[11px] text-muted mt-1 px-1">Bạn</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-paper border border-line flex items-center justify-center text-ink-soft shrink-0 mt-0.5">
          <User size={16} aria-hidden="true" />
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex justify-start gap-3 max-w-3xl mr-auto">
      <div className="w-8 h-8 rounded-full bg-seal text-paper flex items-center justify-center shrink-0 mt-0.5 shadow-card">
        <Bot size={16} aria-hidden="true" />
      </div>

      <div className="flex flex-col items-start max-w-[90%] sm:max-w-[80%]">
        <div
          className={`w-full rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-card ${
            message.isError
              ? 'bg-danger/5 border border-danger/20 text-ink'
              : 'bg-card border border-line text-ink'
          }`}
        >
          {message.isError ? (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-danger">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm font-sans font-medium leading-relaxed">
                  {message.errorMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
                </p>
              </div>

              {onRetry && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="mt-1 text-xs"
                >
                  <RotateCcw
                    size={13}
                    className={isRetrying ? 'animate-spin' : ''}
                    aria-hidden="true"
                  />
                  <span>Thử lại</span>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Main serif answer text rendered with safe markdown */}
              <div className="font-serif text-[15px] sm:text-base leading-relaxed text-ink break-words">
                <SafeMarkdown content={message.content} />
              </div>

              {/* Server-verified sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-line/70">
                  <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-ink-soft mb-2">
                    <BookOpen size={13} className="text-seal" aria-hidden="true" />
                    <span>Nguồn tham khảo:</span>
                  </div>

                  <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                    {message.sources.map((source) => (
                      <li key={source.lessonId}>
                        <Link
                          href={`/lessons/${source.slug}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-paper hover:bg-card border border-line text-xs font-sans text-seal hover:text-seal-dark hover:border-seal transition-colors"
                        >
                          <span className="underline-offset-2 hover:underline">{source.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <span className="text-[11px] text-muted mt-1 px-1">Trợ lý Lịch sử AI</span>
      </div>
    </div>
  );
}
