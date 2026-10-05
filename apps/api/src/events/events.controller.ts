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
import { EventsService } from './events.service';

@ApiTags('Events')
@Public()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active events (public)',
    description: 'Returns paginated list of ACTIVE historical events.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.eventsService.findAllPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single active event by slug (public)' })
  async findOne(
    @Param(new ZodValidationPipe(SlugParamSchema)) { slug }: SlugParamDto,
  ) {
    return this.eventsService.findOneBySlug(slug);
  }
}
