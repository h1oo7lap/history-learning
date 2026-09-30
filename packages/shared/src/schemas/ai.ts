import { z } from 'zod';
import { AiMode } from '../enums';
import { AI } from '../constants';

export const AiChatSchema = z.object({
  message: z.string().min(AI.MIN_MESSAGE_LENGTH).max(AI.MAX_MESSAGE_LENGTH),
  lessonId: z.string().optional(),
  mode: z.nativeEnum(AiMode).default(AiMode.ASK),
});
export type AiChatDto = z.infer<typeof AiChatSchema>;
