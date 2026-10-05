import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles';
import { MediaService } from './media.service';

class SignUploadDto {
  folder?: string;
}

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a signed Cloudinary upload signature (admin only)' })
  sign(@Body() dto: SignUploadDto) {
    const folder = dto.folder ?? 'history-learning/uploads';
    return this.mediaService.signUpload(`history-learning/${folder}`);
  }
}
