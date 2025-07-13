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
import { ValidationService } from '../services/validation.service';
import { ValidateEnrollmentDto } from '../dto/student-courses.dto';
import { CreateTimetableDto } from '../dto/create-timetable.dto';

@ApiTags('validation')
@Controller('validation')
export class ValidationController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly validationService: ValidationService,
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
    const results: any[] = [];
    
    for (const courseId of validationData.courseIds) {
      const result = await this.validationService.validateEnrollment(
        validationData.studentId, 
        courseId
      );
      results.push({
        courseId,
        ...result
      });
    }
    
    return {
      studentId: validationData.studentId,
      validationResults: results,
      allValid: results.every((r: any) => r.isValid)
    };
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
    // For timetable validation, we can use the validation service
    try {
      // Basic validation - check if course exists through the validation service
      const result = await this.validationService.validateTimetableCreation(timetableData);
      
      return {
        valid: result.isValid,
        message: result.message || 'Timetable validation completed',
        conflicts: result.conflicts || []
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        conflicts: []
      };
    }
  }

  @Post('buffer-time-check')
  @ApiOperation({
    summary: 'Validate buffer time between classes',
    description: 'Check if enrollment would maintain required buffer time between consecutive classes',
  })
  @ApiBody({
    type: ValidateEnrollmentDto,
    description: 'Student and course data for buffer time validation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Buffer time validation results',
  })
  async validateBufferTime(@Body(ValidationPipe) validationData: ValidateEnrollmentDto) {
    const results: any[] = [];
    
    for (const courseId of validationData.courseIds) {
      const result = await this.validationService.validateSingleCourseBufferTime(
        validationData.studentId, 
        courseId
      );
      results.push({
        courseId,
        ...result
      });
    }
    
    return {
      studentId: validationData.studentId,
      bufferTimeResults: results,
      allValid: results.every((r: any) => r.isValid)
    };
  }

  @Post('enhanced-enrollment-check')
  @ApiOperation({
    summary: 'Enhanced enrollment validation (with all edge cases)',
    description: 'Comprehensive validation including overnight classes, prerequisites, credit limits, etc.',
  })
  @ApiBody({
    type: ValidateEnrollmentDto,
    description: 'Validation data including student ID and course IDs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Enhanced enrollment validation results',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number' },
        courseIds: { type: 'array', items: { type: 'number' } },
        isValid: { type: 'boolean' },
        message: { type: 'string' },
        violations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validateEnhancedEnrollment(@Body(ValidationPipe) validationData: ValidateEnrollmentDto) {
    const result = await this.validationService.validateEnrollmentEdgeCases(
      validationData.studentId,
      validationData.courseIds
    );
    
    return {
      studentId: validationData.studentId,
      courseIds: validationData.courseIds,
      isValid: result.isValid,
      message: result.message,
      violations: result.violations || []
    };
  }
}
