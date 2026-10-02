import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  TaxonomyListQuerySchema,
  type TaxonomyListQueryDto,
  SlugParamSchema,
  type SlugParamDto,
} from '@history-learning/shared';
import { Public } from '../common/decorators/public';
import { TopicsService } from './topics.service';

@ApiTags('Topics')
@Public()
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active topics (public)',
    description: 'Returns paginated list of ACTIVE topics.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.topicsService.findAllPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single active topic by slug (public)' })
  async findOne(
    @Param(new ZodValidationPipe(SlugParamSchema)) { slug }: SlugParamDto,
  ) {
    return this.topicsService.findOneBySlug(slug);
  }
}
