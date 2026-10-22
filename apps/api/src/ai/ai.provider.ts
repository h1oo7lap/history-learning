export interface AiChatParams {
  systemPrompt: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  userMessage: string;
}

export interface AiProvider {
  chat(params: AiChatParams): Promise<string>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
