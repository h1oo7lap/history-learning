'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RotateCcw, Bot, BookMarked, X, Loader2 } from 'lucide-react';
import { ChatMessageBubble, type ChatMessageItem } from './ChatMessageBubble';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatInput } from './ChatInput';
import { useChat, sliceChatHistory } from '../hooks';
import { Button } from '@/components/ui/Button';

interface ChatContainerProps {
  lessonId?: string;
  onClearLessonScope?: () => void;
}

export function ChatContainer({
  lessonId,
  onClearLessonScope,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const chatMutation = useChat({
    onSuccess: (data) => {
      const newAssistantMessage: ChatMessageItem = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.answer,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
      setLiveAnnouncement(`AI đã trả lời: ${data.answer.slice(0, 100)}...`);
    },
    onError: (errorMessage) => {
      const errorAssistantMessage: ChatMessageItem = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: '',
        isError: true,
        errorMessage,
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
      setLiveAnnouncement(`Có lỗi: ${errorMessage}`);
    },
  });

  // Tự động cuộn xuống khi có tin nhắn mới hoặc trạng thái đang chờ thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages, chatMutation.isPending, scrollToBottom]);

  const handleSendMessage = (textToSend?: string) => {
    const rawQuestion = textToSend !== undefined ? textToSend : inputValue;
    const question = rawQuestion.trim();
    if (!question || chatMutation.isPending) return;

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    // Chuẩn bị history: tối đa 4 tin nhắn gần nhất từ hội thoại hiện tại
    // Giữ nguyên nội dung (server sẽ tự cắt nếu cần)
    const validHistoryMessages = messages.filter((m) => !m.isError);
    const history = sliceChatHistory(validHistoryMessages, 4);

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLiveAnnouncement(`Đang gửi câu hỏi: ${question}`);

    chatMutation.mutate({
      question,
      history,
      lessonId,
    });
  };

  const handleResetChat = () => {
    setMessages([]);
    setInputValue('');
    setLiveAnnouncement('Đã bắt đầu cuộc trò chuyện mới');
  };

  const handleRetryLastMessage = () => {
    if (chatMutation.isPending) return;

    // Tìm câu hỏi gần nhất của người dùng
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    // Xóa tin nhắn lỗi cuối nếu có
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1]?.isError) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    // Lọc lại history trước tin nhắn người dùng này
    const userIndex = messages.findIndex((m) => m.id === lastUserMessage.id);
    const priorHistory = messages
      .slice(0, userIndex)
      .filter((m) => !m.isError);
    const history = sliceChatHistory(priorHistory, 4);

    chatMutation.mutate({
      question: lastUserMessage.content,
      history,
      lessonId,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full bg-paper">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-line bg-card/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-seal text-paper flex items-center justify-center shadow-card shrink-0">
            <Bot size={18} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-base sm:text-lg text-ink leading-tight">
              Hỏi đáp Lịch sử
            </h1>
            <p className="font-sans text-xs text-muted">
              Trợ lý học tập thông minh dựa trên tư liệu bài học
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              id="chat-new-conversation-btn"
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleResetChat}
              disabled={chatMutation.isPending}
              className="text-xs h-8 px-2.5 gap-1.5"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Cuộc trò chuyện mới</span>
            </Button>
          )}
        </div>
      </header>

      {/* ─── Scoped lesson banner ─── */}
      {lessonId && (
        <div
          id="chat-lesson-scope-banner"
          className="flex items-center justify-between px-4 sm:px-6 py-2 bg-bronze/10 border-b border-bronze/20 text-xs text-ink font-sans shrink-0"
        >
          <div className="flex items-center gap-2 truncate">
            <BookMarked size={14} className="text-bronze-ink shrink-0" aria-hidden="true" />
            <span className="font-medium text-bronze-ink">Phạm vi câu hỏi:</span>
            <span className="text-ink truncate">Chỉ tìm kiếm trong bài học hiện tại</span>
          </div>

          {onClearLessonScope ? (
            <button
              type="button"
              onClick={onClearLessonScope}
              className="inline-flex items-center gap-1 text-muted hover:text-ink transition-colors ml-2 shrink-0 cursor-pointer"
              title="Mở rộng tìm kiếm sang tất cả bài học"
            >
              <X size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Hỏi toàn bộ</span>
            </button>
          ) : (
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 text-muted hover:text-ink transition-colors ml-2 shrink-0"
              title="Mở rộng tìm kiếm sang tất cả bài học"
            >
              <X size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Hỏi toàn bộ</span>
            </Link>
          )}
        </div>
      )}

      {/* ─── Messages scroll area ─── */}
      <div
        ref={scrollAreaRef}
        role="region"
        aria-label="Khung tin nhắn hội thoại"
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5"
      >
        {messages.length === 0 ? (
          <ChatEmptyState
            onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            disabled={chatMutation.isPending}
          />
        ) : (
          <div className="space-y-5 max-w-4xl mx-auto">
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              return (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  onRetry={
                    msg.isError && isLastMessage
                      ? handleRetryLastMessage
                      : undefined
                  }
                  isRetrying={chatMutation.isPending}
                />
              );
            })}

            {/* Trạng thái đang trả lời */}
            {chatMutation.isPending && (
              <div
                id="chat-answering-indicator"
                className="flex justify-start gap-3 max-w-3xl mr-auto"
                aria-label="AI đang soạn câu trả lời"
              >
                <div className="w-8 h-8 rounded-full bg-seal text-paper flex items-center justify-center shrink-0 mt-0.5 shadow-card">
                  <Bot size={16} aria-hidden="true" />
                </div>
                <div className="bg-card border border-line text-ink rounded-2xl rounded-tl-sm px-4 py-3 shadow-card flex items-center gap-2 text-sm font-sans text-muted">
                  <Loader2 size={16} className="animate-spin text-seal" aria-hidden="true" />
                  <span>AI đang tra cứu tài liệu và soạn câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* ─── Vùng thông báo trợ năng (aria-live) ─── */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </div>

      {/* ─── Input bar ─── */}
      <div className="shrink-0">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={() => handleSendMessage()}
          isPending={chatMutation.isPending}
        />
      </div>
    </div>
  );
}
