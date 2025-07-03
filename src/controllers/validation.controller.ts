import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { EnrollmentService } from '../services/enrollment.service';
import { AdminService } from '../services/admin.service';
import { ValidateEnrollmentDto } from '../dto/validate-enrollment.dto';
import { CreateTimetableDto } from '../dto/create-timetable.dto';

@ApiTags('validation')
@Controller('validation')
export class ValidationController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly adminService: AdminService,
  ) {}

  @Post('enrollment-check')
  @ApiOperation({
    summary: 'Validate enrollment (dry-run)',
    description: 'Check if student enrollment would be successful without actually enrolling',
  })
  @ApiBody({
    type: ValidateEnrollmentDto,
    description: 'Validation data including student ID and course IDs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Enrollment validation results',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Enrollment validation successful' },
        issues: {
          type: 'array',
          items: { type: 'string' },
          example: [],
        },
      },
    },
  })
  async validateEnrollment(@Body(ValidationPipe) validationData: ValidateEnrollmentDto) {
    return await this.enrollmentService.validateEnrollment(validationData);
  }

  @Post('timetable-check')
  @ApiOperation({
    summary: 'Validate timetable (dry-run)',
    description: 'Check if a timetable can be added without conflicts',
  })
  @ApiBody({
    type: CreateTimetableDto,
    description: 'Timetable data to validate',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timetable validation results',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Timetable validation successful' },
        conflicts: {
          type: 'array',
          items: { type: 'string' },
          example: [],
        },
      },
    },
  })
  async validateTimetable(@Body(ValidationPipe) timetableData: CreateTimetableDto) {
    return await this.adminService.validateTimetable(timetableData);
  }
}
