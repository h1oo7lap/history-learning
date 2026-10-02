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
  CreatePeriodSchema,
  type CreatePeriodDto,
  UpdatePeriodSchema,
  type UpdatePeriodDto,
  IdParamSchema,
  type IdParamDto,
} from '@history-learning/shared';
import { Roles } from '../common/decorators/roles';
import { PeriodsService } from './periods.service';

@ApiTags('Admin / Periods')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/periods')
export class AdminPeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all periods (any status)' })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.periodsService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get period by ID' })
  async findOne(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.periodsService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create period' })
  async create(
    @Body(new ZodValidationPipe(CreatePeriodSchema)) dto: CreatePeriodDto,
  ) {
    return this.periodsService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update period' })
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(UpdatePeriodSchema)) dto: UpdatePeriodDto,
  ) {
    return this.periodsService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: delete period' })
  async remove(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    await this.periodsService.adminDelete(id);
  }
}
