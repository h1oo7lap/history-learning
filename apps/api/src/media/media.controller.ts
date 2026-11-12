import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user';
import type { User } from '../generated/prisma/client';
import { MediaService } from './media.service';

export class SignUploadDto {
  folder?: string;
}

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a signed Cloudinary upload signature' })
  sign(@CurrentUser() user?: User, @Body() dto?: SignUploadDto) {
    const rawFolder =
      user?.role === 'ADMIN'
        ? dto?.folder?.trim() || 'uploads'
        : 'avatars';
    const folder = rawFolder.replace(/^history-learning\/?/, '');
    return this.mediaService.signUpload(`history-learning/${folder}`);
  }
}
