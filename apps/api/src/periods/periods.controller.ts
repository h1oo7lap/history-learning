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
import { PeriodsService } from './periods.service';

@ApiTags('Periods')
@Public()
@Controller('periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active periods (public)',
    description: 'Returns paginated list of ACTIVE historical periods.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.periodsService.findAllPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single active period by slug (public)' })
  async findOne(
    @Param(new ZodValidationPipe(SlugParamSchema)) { slug }: SlugParamDto,
  ) {
    return this.periodsService.findOneBySlug(slug);
  }
}
