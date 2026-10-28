'use client';

import React from 'react';
import { Sparkles, MessageCircleQuestion } from 'lucide-react';

export const SUGGESTED_PROMPTS = [
  'Trận Bạch Đằng năm 938 diễn ra như thế nào và có ý nghĩa gì đối với lịch sử nước ta?',
  'Vì sao vua Lý Thái Tổ quyết định dời đô từ Hoa Lư về Đại La (Thăng Long) năm 1010?',
  'Nêu những chiến công hiển hách của người anh hùng áo vải Quang Trung - Nguyễn Huệ?',
] as const;

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function ChatEmptyState({ onSelectPrompt, disabled = false }: ChatEmptyStateProps) {
  return (
    <div className="py-8 sm:py-12 px-4 max-w-2xl mx-auto text-center flex flex-col items-center">
      <div className="w-12 h-12 rounded-xl bg-seal/10 text-seal flex items-center justify-center mb-4 border border-seal/20">
        <Sparkles size={24} aria-hidden="true" />
      </div>

      <h2 className="font-serif font-bold text-2xl sm:text-3xl text-ink tracking-tight mb-2">
        Hỏi đáp Lịch sử Việt Nam
      </h2>

      <p className="font-sans text-sm sm:text-base text-muted max-w-lg mb-8 leading-relaxed">
        Đặt câu hỏi về các sự kiện, nhân vật, triều đại hoặc kiến thức lịch sử.
        Trợ lý AI sẽ tra cứu dữ liệu bài học để giải đáp cho bạn.
      </p>

      <div className="w-full space-y-2.5 text-left">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted px-1 flex items-center gap-1.5">
          <MessageCircleQuestion size={14} className="text-bronze-ink" aria-hidden="true" />
          <span>Gợi ý câu hỏi bắt đầu:</span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-1">
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(prompt)}
              className="w-full text-left p-3.5 sm:p-4 rounded-lg bg-card hover:bg-paper border border-line hover:border-seal text-ink-soft hover:text-ink text-sm sm:text-[15px] font-sans leading-relaxed transition-all shadow-card hover:shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group flex items-start justify-between gap-3"
            >
              <span className="group-hover:text-seal transition-colors">{prompt}</span>
              <span className="text-muted group-hover:text-seal font-semibold text-xs shrink-0 mt-0.5">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
