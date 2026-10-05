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
  CreateEventSchema,
  type CreateEventDto,
  UpdateEventSchema,
  type UpdateEventDto,
  IdParamSchema,
  type IdParamDto,
} from '@history-learning/shared';
import { Roles } from '../common/decorators/roles';
import { EventsService } from './events.service';

@ApiTags('Admin / Events')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all events (any status)' })
  async findAll(
    @Query(new ZodValidationPipe(TaxonomyListQuerySchema))
    query: TaxonomyListQueryDto,
  ) {
    return this.eventsService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get event by ID' })
  async findOne(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.eventsService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create event' })
  async create(
    @Body(new ZodValidationPipe(CreateEventSchema)) dto: CreateEventDto,
  ) {
    return this.eventsService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update event' })
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(UpdateEventSchema)) dto: UpdateEventDto,
  ) {
    return this.eventsService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: soft-delete event (set INACTIVE)' })
  async remove(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    await this.eventsService.adminDelete(id);
  }
}
