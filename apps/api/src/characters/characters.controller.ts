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
import { CharactersService } from './characters.service';

@ApiTags('Characters')
@Public()
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({
    summary: 'List active characters (public)',
    description: 'Returns paginated list of ACTIVE historical characters.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.charactersService.findAllPublic(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single active character by slug (public)',
  })
  async findOne(
    @Param(new ZodValidationPipe(SlugParamSchema)) { slug }: SlugParamDto,
  ) {
    return this.charactersService.findOneBySlug(slug);
  }
}
