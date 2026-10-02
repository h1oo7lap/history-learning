import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  TaxonomyListQuerySchema,
  type TaxonomyListQueryDto,
  CreateTopicSchema,
  type CreateTopicDto,
  UpdateTopicSchema,
  type UpdateTopicDto,
  IdParamSchema,
  type IdParamDto,
} from '@history-learning/shared';
import { Roles } from '../common/decorators/roles';
import { TopicsService } from './topics.service';

@ApiTags('Admin / Topics')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/topics')
export class AdminTopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all topics (any status)' })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.topicsService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get topic by ID' })
  async findOne(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.topicsService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create topic' })
  async create(
    @Body(new ZodValidationPipe(CreateTopicSchema)) dto: CreateTopicDto,
  ) {
    return this.topicsService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update topic' })
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(UpdateTopicSchema)) dto: UpdateTopicDto,
  ) {
    return this.topicsService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: delete topic' })
  async remove(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    await this.topicsService.adminDelete(id);
  }
}
