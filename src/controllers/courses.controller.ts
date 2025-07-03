import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { EnrollmentService } from '../services/enrollment.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('college/:collegeId')
  @ApiOperation({
    summary: 'List courses by college',
    description: 'Get all courses available for a specific college',
  })
  @ApiParam({
    name: 'collegeId',
    type: 'number',
    description: 'The ID of the college',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of courses for the specified college',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          code: { type: 'string', example: 'CS101' },
          name: { type: 'string', example: 'Introduction to Computer Science' },
          description: { type: 'string', example: 'Basic programming concepts' },
          credits: { type: 'number', example: 4 },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'College not found',
  })
  async getCoursesByCollege(@Param('collegeId', ParseIntPipe) collegeId: number) {
    return await this.enrollmentService.browseCoursesByCollege(collegeId);
  }

  @Get(':courseId/timetable')
  @ApiOperation({
    summary: 'Get course timetable',
    description: 'Retrieve the timetable schedule for a specific course',
  })
  @ApiParam({
    name: 'courseId',
    type: 'number',
    description: 'The ID of the course',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timetable schedule for the course',
    schema: {
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
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async getCourseTimetable(@Param('courseId', ParseIntPipe) courseId: number) {
    return await this.enrollmentService.getCourseTimetable(courseId);
  }
}
