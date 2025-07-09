import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
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
import { AdminService } from '../services/admin.service';
import { EnrollmentService } from '../services/enrollment.service';
import { CreateTimetableDto } from '../dto/create-timetable.dto';
import { CreateCollegeDto } from '../dto/create-college.dto';
import { CreateStudentDto } from '../dto/create-student.dto';
import { CreateCourseDto } from '../dto/create-course.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  @Post('timetable')
  @ApiOperation({
    summary: 'Create course timetable',
    description:
      'Create a new timetable entry for a course with conflict validation',
  })
  @ApiBody({
    type: CreateTimetableDto,
    description:
      'Timetable data including course ID, day, times, and optional room',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Timetable successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        courseId: { type: 'number', example: 1 },
        dayOfWeek: { type: 'string', example: 'MONDAY' },
        startTime: { type: 'string', example: '09:00' },
        endTime: { type: 'string', example: '10:30' },
        room: { type: 'string', example: 'Room 101' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation failed or invalid time range',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'End time must be after start time',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Course with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Timetable conflict with existing schedule',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example:
            'Timetable conflicts with existing schedule: MONDAY 09:00-10:30',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async createTimetable(
    @Body(ValidationPipe) timetableData: CreateTimetableDto,
  ) {
    return await this.adminService.createTimetable(timetableData);
  }

  @Put('timetable/:timetableId')
  @ApiOperation({
    summary: 'Update course timetable',
    description:
      'Update an existing timetable with validation for enrolled student conflicts',
  })
  @ApiParam({
    name: 'timetableId',
    type: 'number',
    description: 'The ID of the timetable to update',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dayOfWeek: {
          type: 'string',
          enum: [
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
            'SUNDAY',
          ],
        },
        startTime: {
          type: 'string',
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          example: '14:30',
        },
        endTime: {
          type: 'string',
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          example: '16:00',
        },
        room: { type: 'string', example: 'Room 102' },
      },
    },
    description: 'Partial timetable data to update',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timetable successfully updated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        courseId: { type: 'number', example: 1 },
        dayOfWeek: { type: 'string', example: 'MONDAY' },
        startTime: { type: 'string', example: '14:30' },
        endTime: { type: 'string', example: '16:00' },
        room: { type: 'string', example: 'Room 102' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'End time must be after start time',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timetable not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Timetable with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Update would create conflicts for enrolled students',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example:
            'Cannot update timetable: would create conflict for student John Doe with course CS102',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async updateTimetable(
    @Param('timetableId', ParseIntPipe) timetableId: number,
    @Body(ValidationPipe) updateData: Partial<CreateTimetableDto>,
  ) {
    return await this.adminService.updateTimetable(timetableId, updateData);
  }

  @Delete('timetable/:timetableId')
  @ApiOperation({
    summary: 'Delete course timetable',
    description:
      'Delete a timetable entry if no students are currently enrolled',
  })
  @ApiParam({
    name: 'timetableId',
    type: 'number',
    description: 'The ID of the timetable to delete',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timetable successfully deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Timetable deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Timetable not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Timetable with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete timetable with enrolled students',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example:
            'Cannot delete timetable: students are currently enrolled in this course',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async deleteTimetable(
    @Param('timetableId', ParseIntPipe) timetableId: number,
  ) {
    return await this.adminService.deleteTimetable(timetableId);
  }

  @Get('course/:courseId/timetables')
  @ApiOperation({
    summary: 'Get course timetables',
    description: 'Retrieve all timetable entries for a specific course',
  })
  @ApiParam({
    name: 'courseId',
    type: 'number',
    description: 'The ID of the course',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of timetables for the course',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          courseId: { type: 'number', example: 1 },
          dayOfWeek: { type: 'string', example: 'MONDAY' },
          startTime: { type: 'string', example: '09:00' },
          endTime: { type: 'string', example: '10:30' },
          room: { type: 'string', example: 'Room 101' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Course with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async getCourseTimetables(@Param('courseId', ParseIntPipe) courseId: number) {
    return await this.adminService.getCourseTimetables(courseId);
  }

  // College Management
  @Post('colleges')
  @ApiOperation({
    summary: 'Create a new college',
    description: 'Add a new college to the system',
  })
  @ApiBody({
    type: CreateCollegeDto,
    description: 'College data including name and description',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'College successfully created',
  })
  async createCollege(@Body(ValidationPipe) collegeData: CreateCollegeDto) {
    return await this.adminService.createCollege(collegeData);
  }

  @Get('colleges')
  @ApiOperation({
    summary: 'Get all colleges',
    description: 'Retrieve a list of all colleges',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all colleges',
  })
  async getAllColleges() {
    return await this.adminService.getAllColleges();
  }

  @Put('colleges/:id')
  @ApiOperation({
    summary: 'Update a college',
    description: 'Update college information',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the college to update',
  })
  @ApiBody({
    type: CreateCollegeDto,
    description: 'Updated college data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'College successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'College not found',
  })
  async updateCollege(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) collegeData: CreateCollegeDto,
  ) {
    return await this.adminService.updateCollege(id, collegeData);
  }

  @Delete('colleges/:id')
  @ApiOperation({
    summary: 'Delete a college',
    description: 'Delete a college if no students or courses are associated',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the college to delete',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'College successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'College not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete college with associated students or courses',
  })
  async deleteCollege(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.deleteCollege(id);
  }

  // Student Management
  @Post('students')
  @ApiOperation({
    summary: 'Create a new student',
    description: 'Add a new student to the system',
  })
  @ApiBody({
    type: CreateStudentDto,
    description: 'Student data including name, email, and college',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student successfully created',
  })
  async createStudent(@Body(ValidationPipe) studentData: CreateStudentDto) {
    return await this.adminService.createStudent(studentData);
  }

  @Get('students/:id')
  @ApiOperation({
    summary: 'Get student details',
    description: 'Retrieve detailed information about a specific student',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the student',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  async getStudent(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.getStudent(id);
  }

  @Put('students/:id')
  @ApiOperation({
    summary: 'Update a student',
    description: 'Update student information',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the student to update',
  })
  @ApiBody({
    type: CreateStudentDto,
    description: 'Updated student data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  async updateStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) studentData: CreateStudentDto,
  ) {
    return await this.adminService.updateStudent(id, studentData);
  }

  @Delete('students/:id')
  @ApiOperation({
    summary: 'Delete a student',
    description: 'Remove a student from the system',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the student to delete',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  async deleteStudent(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.deleteStudent(id);
  }

  // Course Management
  @Post('courses')
  @ApiOperation({
    summary: 'Create a new course',
    description: 'Add a new course to the system',
  })
  @ApiBody({
    type: CreateCourseDto,
    description: 'Course data including code, name, credits, and college',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course successfully created',
  })
  async createCourse(@Body(ValidationPipe) courseData: CreateCourseDto) {
    return await this.adminService.createCourse(courseData);
  }

  @Get('courses/:id')
  @ApiOperation({
    summary: 'Get course details',
    description: 'Retrieve detailed information about a specific course',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the course',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async getCourse(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.getCourse(id);
  }

  @Put('courses/:id')
  @ApiOperation({
    summary: 'Update a course',
    description: 'Update course information',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the course to update',
  })
  @ApiBody({
    type: CreateCourseDto,
    description: 'Updated course data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) courseData: CreateCourseDto,
  ) {
    return await this.adminService.updateCourse(id, courseData);
  }

  @Delete('courses/:id')
  @ApiOperation({
    summary: 'Delete a course',
    description: 'Remove a course from the system if no enrollments exist',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the course to delete',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete course with enrollments',
  })
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    return await this.adminService.deleteCourse(id);
  }

  // Course Completion Management
  @Put('course-completion')
  @ApiOperation({
    summary: 'Mark course as completed for student',
    description: 'Mark a course as completed for a student (used by professors/admin)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 1 },
        courseId: { type: 'number', example: 1 },
        grade: { type: 'string', example: 'A' },
      },
      required: ['studentId', 'courseId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course marked as completed successfully',
  })
  async markCourseCompleted(
    @Body() data: { studentId: number; courseId: number; grade?: string },
  ) {
    return this.enrollmentService.markCourseCompleted(
      data.studentId,
      data.courseId,
      data.grade,
    );
  }

  @Post('bulk-course-completion')
  @ApiOperation({
    summary: 'Bulk complete courses (semester end)',
    description: 'Mark multiple courses as completed for multiple students',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        completions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'number' },
              courseId: { type: 'number' },
              grade: { type: 'string' },
            },
            required: ['studentId', 'courseId'],
          },
        },
      },
    },
  })
  async bulkCompleteCourses(
    @Body() data: { completions: Array<{ studentId: number; courseId: number; grade?: string }> },
  ) {
    return this.enrollmentService.bulkCompleteCourses(data.completions);
  }

  @Get('student-completed-courses/:studentId')
  @ApiOperation({
    summary: 'Get student completed courses',
    description: 'Get list of courses completed by a student',
  })
  @ApiParam({
    name: 'studentId',
    type: 'number',
    description: 'Student ID',
  })
  async getStudentCompletedCourses(
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    const completedEnrollments = await this.enrollmentService.getStudentCompletedCoursesWithGrades(studentId);
    return {
      studentId,
      completedCourses: completedEnrollments.map(enrollment => ({
        id: enrollment.course.id,
        code: enrollment.course.code,
        name: enrollment.course.name,
        credits: enrollment.course.credits,
        grade: enrollment.grade,
        completedAt: enrollment.enrolledAt,
      })),
      totalCompletedCourses: completedEnrollments.length,
      totalCreditsCompleted: completedEnrollments.reduce((sum, enrollment) => sum + enrollment.course.credits, 0),
    };
  }
}
