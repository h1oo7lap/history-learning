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
  CreateCharacterSchema,
  type CreateCharacterDto,
  UpdateCharacterSchema,
  type UpdateCharacterDto,
  IdParamSchema,
  type IdParamDto,
} from '@history-learning/shared';
import { Roles } from '../common/decorators/roles';
import { CharactersService } from './characters.service';

@ApiTags('Admin / Characters')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/characters')
export class AdminCharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all characters (any status)' })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.charactersService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get character by ID' })
  async findOne(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.charactersService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create character' })
  async create(
    @Body(new ZodValidationPipe(CreateCharacterSchema)) dto: CreateCharacterDto,
  ) {
    return this.charactersService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update character' })
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(UpdateCharacterSchema)) dto: UpdateCharacterDto,
  ) {
    return this.charactersService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: soft-delete character (set INACTIVE)' })
  async remove(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    await this.charactersService.adminDelete(id);
  }
}
