import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public';
import { GradesService } from './grades.service';

@ApiTags('Grades')
@Controller()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Public()
  @Get('education-levels')
  @ApiOperation({ summary: 'Get all education levels with their grades' })
  async getEducationLevels() {
    return this.gradesService.findAllEducationLevels();
  }

  @Public()
  @Get('grades')
  @ApiOperation({ summary: 'Get all grades (flat list)' })
  async getGrades() {
    return this.gradesService.findAllGrades();
  }
}
