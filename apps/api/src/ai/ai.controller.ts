import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { AiChatSchema, type AiChatDto, type AiChatResponseDto } from '@history-learning/shared';
import { ChatService } from './chat.service';
import { UserThrottlerGuard } from '../common/guards/user-throttler.guard';
import { CurrentUser } from '../common/decorators/current-user';

@Controller('ai')
export class AiController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserThrottlerGuard)
  @Throttle({
    default: { limit: 10, ttl: 60000 },
  })
  async chat(
    @Body(new ZodValidationPipe(AiChatSchema)) dto: AiChatDto,
    @CurrentUser() user: any,
  ): Promise<AiChatResponseDto> {
    return this.chatService.chat(dto, user);
  }
}
