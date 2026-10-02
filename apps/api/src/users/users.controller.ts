import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user';
import { UsersService } from './users.service';
import { UpdateProfileSchema } from '@history-learning/shared';
import type { User } from '../generated/prisma/client';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (fullName, avatar, gradeId)' })
  async updateMe(@CurrentUser() user: User, @Body() body: unknown) {
    const dto = UpdateProfileSchema.parse(body);
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/progress')
  @ApiOperation({ summary: 'Get all lesson progress for current user' })
  async getProgress(@CurrentUser() user: User) {
    return this.usersService.getProgress(user.id);
  }

  @Get('me/collection')
  @ApiOperation({ summary: 'Get card collection for current user' })
  async getCollection(@CurrentUser() user: User) {
    return this.usersService.getCollection(user.id);
  }

  @Get('me/missions')
  @ApiOperation({ summary: 'Get missions progress for current user' })
  async getMissions(@CurrentUser() user: User) {
    return this.usersService.getMissions(user.id);
  }
}
