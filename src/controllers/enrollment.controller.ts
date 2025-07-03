import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EnrollmentService } from '../services/enrollment.service';
import { EnrollStudentDto } from '../dto/enroll-student.dto';
import { UnenrollStudentDto } from '../dto/unenroll-student.dto';

@ApiTags('enrollment')
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @ApiOperation({
    summary: 'Enroll student in courses',
    description:
      'Enroll a student in multiple courses with validation for college consistency and timetable conflicts',
  })
  @ApiBody({
    type: EnrollStudentDto,
    description: 'Student enrollment data including student ID and course IDs',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student successfully enrolled in courses',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully enrolled student John Doe in 2 course(s)',
        },
        enrolledCourses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              code: { type: 'string', example: 'CS101' },
              name: {
                type: 'string',
                example: 'Introduction to Computer Science',
              },
              description: {
                type: 'string',
                example: 'Basic programming concepts',
              },
              credits: { type: 'number', example: 4 },
              collegeId: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad request - validation failed, timetable conflicts, or college mismatch',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Timetable conflicts detected: MONDAY 09:00-10:30 conflicts with 09:30-11:00',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student or courses not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Student with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async enrollStudent(@Body(ValidationPipe) enrollmentData: EnrollStudentDto) {
    return await this.enrollmentService.enrollStudent(enrollmentData);
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Get student enrollments',
    description: 'Retrieve all courses that a specific student is enrolled in',
  })
  @ApiParam({
    name: 'studentId',
    type: 'number',
    description: 'The ID of the student',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of courses the student is enrolled in',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          code: { type: 'string', example: 'CS101' },
          name: { type: 'string', example: 'Introduction to Computer Science' },
          description: {
            type: 'string',
            example: 'Basic programming concepts',
          },
          credits: { type: 'number', example: 4 },
          collegeId: { type: 'number', example: 1 },
          timetables: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                dayOfWeek: { type: 'string', example: 'MONDAY' },
                startTime: { type: 'string', example: '09:00' },
                endTime: { type: 'string', example: '10:30' },
                room: { type: 'string', example: 'Room 101' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Student with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async getStudentEnrollments(
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return await this.enrollmentService.getStudentEnrollments(studentId);
  }

  @Delete('unenroll')
  @ApiOperation({
    summary: 'Unenroll student from courses',
    description: 'Remove a student from one or more courses',
  })
  @ApiBody({
    type: UnenrollStudentDto,
    description: 'Student unenrollment data including student ID and course IDs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student successfully unenrolled from courses',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully unenrolled student John Doe from 2 course(s)',
        },
        unenrolledCourses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              code: { type: 'string', example: 'CS101' },
              name: { type: 'string', example: 'Introduction to Computer Science' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student or courses not found',
  })
  async unenrollStudent(@Body(ValidationPipe) unenrollmentData: UnenrollStudentDto) {
    return await this.enrollmentService.unenrollStudent(unenrollmentData);
  }
}
