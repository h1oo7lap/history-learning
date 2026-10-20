import { z } from 'zod';
import { AI } from '../constants';

export const AiChatMessageSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('user'),
    content: z
      .string()
      .min(AI.MIN_MESSAGE_LENGTH, 'Tin nhắn của người dùng không được để trống')
      .max(AI.MAX_MESSAGE_LENGTH, `Tin nhắn tối đa ${AI.MAX_MESSAGE_LENGTH} ký tự`),
  }),
  z.object({
    role: z.literal('model'),
    content: z
      .string()
      .transform((val) => val.slice(0, AI.MAX_MODEL_MESSAGE_LENGTH)),
  }),
]);
export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

export const AiChatSchema = z.object({
  question: z
    .string()
    .min(AI.MIN_MESSAGE_LENGTH, 'Câu hỏi không được để trống')
    .max(AI.MAX_MESSAGE_LENGTH, `Câu hỏi tối đa ${AI.MAX_MESSAGE_LENGTH} ký tự`),
  history: z
    .array(AiChatMessageSchema)
    .max(AI.MAX_HISTORY_MESSAGES, `Lịch sử tối đa ${AI.MAX_HISTORY_MESSAGES} tin nhắn`)
    .optional()
    .default([]),
  lessonId: z.string().optional(),
});
export type AiChatDto = z.infer<typeof AiChatSchema>;

export const AiChatRequestSchema = AiChatSchema;
export type AiChatRequestDto = AiChatDto;

export const AiSourceSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  slug: z.string(),
});
export type AiSource = z.infer<typeof AiSourceSchema>;

export const AiChatResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(AiSourceSchema),
});
export type AiChatResponseDto = z.infer<typeof AiChatResponseSchema>;
