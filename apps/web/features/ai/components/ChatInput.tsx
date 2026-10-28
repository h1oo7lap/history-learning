'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const MAX_CHAR_COUNT = 500;

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isPending,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const canSubmit = value.trim().length > 0 && !isOverLimit && !isPending && !disabled;

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full bg-card border-t border-line p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }}
          className="relative flex items-end gap-2 p-1.5 sm:p-2 rounded-xl bg-paper border border-line focus-within:border-seal focus-within:ring-1 focus-within:ring-seal transition-all shadow-card"
        >
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={1}
            value={value}
            maxLength={MAX_CHAR_COUNT}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isPending}
            placeholder="Hỏi về nhân vật, sự kiện hoặc bài học... (Nhấn Enter để gửi)"
            aria-label="Nội dung câu hỏi gửi tới AI"
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm sm:text-[15px] font-sans text-ink placeholder:text-muted focus:outline-none min-h-[38px] max-h-[160px] leading-relaxed disabled:opacity-50"
          />

          <div className="flex items-center gap-2 shrink-0 pb-0.5 pr-0.5">
            <span
              id="chat-char-counter"
              className={`text-xs font-sans tabular-nums select-none ${
                charCount >= 450
                  ? isOverLimit
                    ? 'text-danger font-semibold'
                    : 'text-bronze-ink font-medium'
                  : 'text-muted'
              }`}
              aria-live="polite"
            >
              {charCount}/{MAX_CHAR_COUNT}
            </span>

            <Button
              id="chat-submit-btn"
              type="submit"
              variant="primary"
              size="sm"
              disabled={!canSubmit}
              aria-label={isPending ? 'Đang gửi câu hỏi' : 'Gửi câu hỏi'}
              className="h-9 w-9 p-0 rounded-lg shrink-0 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={15} aria-hidden="true" />
              )}
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between px-1 text-[11px] sm:text-xs text-muted font-sans">
          <span>AI có thể sai, hãy đối chiếu với bài học</span>
          <span className="hidden sm:inline">Shift + Enter để xuống dòng</span>
        </div>
      </div>
    </div>
  );
}
