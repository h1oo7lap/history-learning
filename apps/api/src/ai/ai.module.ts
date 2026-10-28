import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AI_PROVIDER } from './ai.provider';
import { GeminiProvider } from './gemini.provider';
import { EMBEDDING_PROVIDER } from './embedding.provider';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider';
import { RETRIEVER } from './retriever.interface';
import { VectorRetriever } from './vector-retriever';
import { LessonIndexingService } from './lesson-indexing.service';
import { ChatService } from './chat.service';
import { AiController } from './ai.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: GeminiProvider,
    },
    {
      provide: EMBEDDING_PROVIDER,
      useClass: GeminiEmbeddingProvider,
    },
    {
      provide: RETRIEVER,
      useClass: VectorRetriever,
    },
    LessonIndexingService,
    ChatService,
  ],
  exports: [
    AI_PROVIDER,
    EMBEDDING_PROVIDER,
    RETRIEVER,
    LessonIndexingService,
    ChatService,
  ],
})
export class AiModule {}
