import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Course } from '../entities/course.entity';
import { Timetable } from '../entities/timetable.entity';
import { StudentCourseSelection, EnrollmentStatus } from '../entities/student-course-selection.entity';
import { College } from '../entities/college.entity';
import { EnrollStudentDto } from '../dto/enroll-student.dto';
import { UnenrollStudentDto } from '../dto/unenroll-student.dto';
import { ValidateEnrollmentDto } from '../dto/validate-enrollment.dto';
import { EnhancedValidationService } from './enhanced-validation.service';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Timetable)
    private timetableRepository: Repository<Timetable>,
    @InjectRepository(StudentCourseSelection)
    private studentCourseSelectionRepository: Repository<StudentCourseSelection>,
    @InjectRepository(College)
    private collegeRepository: Repository<College>,
    private dataSource: DataSource,
    private enhancedValidationService: EnhancedValidationService,
  ) {}

  async enrollStudent(
    enrollmentData: EnrollStudentDto,
  ): Promise<{ message: string; enrolledCourses: Course[] }> {
    const { studentId, courseIds } = enrollmentData;

    try {
      // Validate input
      if (!courseIds || courseIds.length === 0) {
        throw new BadRequestException('Course list cannot be empty');
      }

      // Start transaction
      return await this.dataSource.transaction(async (manager) => {
        try {
          // 1. Verify student exists
          const student = await manager.findOne(Student, {
            where: { id: studentId },
            relations: ['college'],
          });

          if (!student) {
            throw new NotFoundException(
              `Student with ID ${studentId} not found`,
            );
          }

          // 2. Verify all courses exist and belong to the same college as student
          const courses = await manager.find(Course, {
            where: courseIds.map((id) => ({ id })),
            relations: ['college', 'timetables'],
          });

          if (courses.length !== courseIds.length) {
            const foundCourseIds = courses.map((c) => c.id);
            const missingCourseIds = courseIds.filter(
              (id) => !foundCourseIds.includes(id),
            );
            throw new NotFoundException(
              `Courses not found: ${missingCourseIds.join(', ')}`,
            );
          }

          // 3. Verify all courses belong to student's college
          const invalidCourses = courses.filter(
            (course) => course.collegeId !== student.collegeId,
          );
          if (invalidCourses.length > 0) {
            throw new BadRequestException(
              `Student can only enroll in courses from their college. Invalid courses: ${invalidCourses.map((c) => c.code).join(', ')}`,
            );
          }

          // 4. Get all timetables for the selected courses
          const timetables = await manager.find(Timetable, {
            where: courseIds.map((courseId) => ({ courseId })),
          });

          // 5. Enhanced validation for all edge cases
          const validationResult = await this.enhancedValidationService.validateEnrollmentEdgeCases(
            studentId,
            courses,
            timetables,
            student.collegeId,
          );

          if (!validationResult.valid) {
            throw new BadRequestException(
              `Enrollment validation failed: ${validationResult.violations.join('; ')}`,
            );
          }

          // 6. Check if student is already enrolled in any of these courses
          const existingEnrollments = await manager.find(
            StudentCourseSelection,
            {
              where: {
                studentId,
                courseId: courseIds.length === 1 ? courseIds[0] : undefined,
              },
            },
          );

          if (courseIds.length > 1) {
            const additionalEnrollments = await manager.find(
              StudentCourseSelection,
              {
                where: courseIds
                  .slice(1)
                  .map((courseId) => ({ studentId, courseId })),
              },
            );
            existingEnrollments.push(...additionalEnrollments);
          }

          if (existingEnrollments.length > 0) {
            const enrolledCourseIds = existingEnrollments.map(
              (e) => e.courseId,
            );
            const enrolledCourses = courses.filter((c) =>
              enrolledCourseIds.includes(c.id),
            );
            throw new BadRequestException(
              `Student is already enrolled in: ${enrolledCourses.map((c) => c.code).join(', ')}`,
            );
          }

          // 7. Create enrollment records
          const enrollmentRecords = courseIds.map((courseId) =>
            manager.create(StudentCourseSelection, {
              studentId,
              courseId,
              status: EnrollmentStatus.ENROLLED,
            }),
          );

          await manager.save(StudentCourseSelection, enrollmentRecords);

          return {
            message: `Successfully enrolled student ${student.name} in ${courses.length} course(s)`,
            enrolledCourses: courses,
          };
        } catch (error) {
          // Handle specific errors from the transaction
          if (
            error instanceof BadRequestException ||
            error instanceof NotFoundException ||
            error instanceof ConflictException
          ) {
            throw error;
          }
          // Log and rethrow unexpected errors
          console.error('Error in enrollment transaction:', error);
          throw new BadRequestException(
            'Failed to process enrollment: ' + error.message,
          );
        }
      });
    } catch (error) {
      // Handle outer errors (outside the transaction)
      console.error('Enrollment error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Enrollment failed: ' + error.message);
    }
  }

  private findTimetableConflicts(timetables: Timetable[]): string[] {
    const conflicts: string[] = [];

    for (let i = 0; i < timetables.length; i++) {
      for (let j = i + 1; j < timetables.length; j++) {
        const timetable1 = timetables[i];
        const timetable2 = timetables[j];

        // Check if they are on the same day
        if (timetable1.dayOfWeek === timetable2.dayOfWeek) {
          // Check for time overlap
          if (
            this.timesOverlap(
              timetable1.startTime,
              timetable1.endTime,
              timetable2.startTime,
              timetable2.endTime,
            )
          ) {
            conflicts.push(
              `${timetable1.dayOfWeek} ${timetable1.startTime}-${timetable1.endTime} conflicts with ${timetable2.startTime}-${timetable2.endTime}`,
            );
          }
        }
      }
    }

    return conflicts;
  }

  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const startTime1 = this.timeToMinutes(start1);
    const endTime1 = this.timeToMinutes(end1);
    const startTime2 = this.timeToMinutes(start2);
    const endTime2 = this.timeToMinutes(end2);

    return startTime1 < endTime2 && endTime1 > startTime2;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async getStudentEnrollments(studentId: number): Promise<Course[]> {
    try {
      const student = await this.studentRepository.findOne({
        where: { id: studentId },
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      const enrollments = await this.studentCourseSelectionRepository.find({
        where: { studentId },
        relations: ['course', 'course.timetables'],
      });

      return enrollments.map((enrollment) => enrollment.course);
    } catch (error) {
      console.error('Error getting student enrollments:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to retrieve student enrollments: ' + error.message,
      );
    }
  }

  async unenrollStudent(
    unenrollmentData: UnenrollStudentDto,
  ): Promise<{ message: string; unenrolledCourses: Course[] }> {
    const { studentId, courseIds } = unenrollmentData;

    try {
      if (!courseIds || courseIds.length === 0) {
        throw new BadRequestException('Course list cannot be empty');
      }

      return await this.dataSource.transaction(async (manager) => {
        // Verify student exists
        const student = await manager.findOne(Student, {
          where: { id: studentId },
        });

        if (!student) {
          throw new NotFoundException(`Student with ID ${studentId} not found`);
        }

        // Get courses to unenroll from
        const courses = await manager.find(Course, {
          where: { id: In(courseIds) },
        });

        if (courses.length !== courseIds.length) {
          const foundIds = courses.map((c) => c.id);
          const missingIds = courseIds.filter((id) => !foundIds.includes(id));
          throw new NotFoundException(
            `Courses not found: ${missingIds.join(', ')}`,
          );
        }

        // Remove enrollments
        await manager.delete(StudentCourseSelection, {
          studentId: studentId,
          courseId: In(courseIds),
        });

        return {
          message: `Successfully unenrolled student ${student.name} from ${courses.length} course(s)`,
          unenrolledCourses: courses,
        };
      });
    } catch (error) {
      console.error('Error unenrolling student:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to unenroll student: ' + error.message);
    }
  }

  async browseCourses(): Promise<Course[]> {
    try {
      return await this.courseRepository.find({
        relations: ['college'],
        order: { college: { name: 'ASC' }, code: 'ASC' },
      });
    } catch (error) {
      console.error('Error browsing courses:', error);
      throw new BadRequestException('Failed to retrieve courses: ' + error.message);
    }
  }

  async browseCoursesByCollege(collegeId: number): Promise<Course[]> {
    try {
      // Verify college exists
      const college = await this.collegeRepository.findOne({
        where: { id: collegeId },
      });

      if (!college) {
        throw new NotFoundException(`College with ID ${collegeId} not found`);
      }

      return await this.courseRepository.find({
        where: { collegeId: collegeId },
        order: { code: 'ASC' },
      });
    } catch (error) {
      console.error('Error browsing courses by college:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve courses: ' + error.message);
    }
  }

  async validateEnrollment(
    validationData: ValidateEnrollmentDto,
  ): Promise<{ valid: boolean; message: string; issues: string[] }> {
    const { studentId, courseIds } = validationData;
    const issues: string[] = [];

    try {
      if (!courseIds || courseIds.length === 0) {
        return {
          valid: false,
          message: 'Course list cannot be empty',
          issues: ['Course list cannot be empty'],
        };
      }

      // Verify student exists
      const student = await this.studentRepository.findOne({
        where: { id: studentId },
        relations: ['college'],
      });

      if (!student) {
        return {
          valid: false,
          message: `Student with ID ${studentId} not found`,
          issues: [`Student with ID ${studentId} not found`],
        };
      }

      // Get courses and verify they exist
      const courses = await this.courseRepository.find({
        where: { id: In(courseIds) },
        relations: ['college'],
      });

      if (courses.length !== courseIds.length) {
        const foundIds = courses.map((c) => c.id);
        const missingIds = courseIds.filter((id) => !foundIds.includes(id));
        issues.push(`Courses not found: ${missingIds.join(', ')}`);
      }

      // Check college consistency
      const invalidColleges = courses.filter(
        (course) => course.collegeId !== student.collegeId,
      );
      if (invalidColleges.length > 0) {
        issues.push(
          `College mismatch: Student belongs to ${student.college.name}, but courses ${invalidColleges.map((c) => c.code).join(', ')} belong to different colleges`,
        );
      }

      // Check for existing enrollments
      const existingEnrollments = await this.studentCourseSelectionRepository.find({
        where: {
          studentId: studentId,
          courseId: In(courseIds),
        },
        relations: ['course'],
      });

      if (existingEnrollments.length > 0) {
        const enrolledCourses = existingEnrollments.map((e) => e.course.code);
        issues.push(`Student is already enrolled in: ${enrolledCourses.join(', ')}`);
      }

      // Enhanced validation using the new validation service
      if (courses.length > 0) {
        const timetables = await this.timetableRepository.find({
          where: { courseId: In(courses.map((c) => c.id)) },
          relations: ['course'],
        });

        const validationResult = await this.enhancedValidationService.validateEnrollmentEdgeCases(
          studentId,
          courses,
          timetables,
          student.collegeId,
        );

        if (!validationResult.valid) {
          issues.push(...validationResult.violations);
        }
      }

      const isValid = issues.length === 0;
      return {
        valid: isValid,
        message: isValid ? 'Enrollment validation successful' : 'Validation failed',
        issues,
      };
    } catch (error) {
      console.error('Error validating enrollment:', error);
      return {
        valid: false,
        message: 'Validation failed due to system error',
        issues: ['System error during validation'],
      };
    }
  }

  async getCourseTimetable(courseId: number): Promise<Timetable[]> {
    try {
      // Verify course exists
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      return await this.timetableRepository.find({
        where: { courseId: courseId },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
      });
    } catch (error) {
      console.error('Error getting course timetable:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve course timetable: ' + error.message);
    }
  }

  /**
   * Mark a course as completed for a student
   * Used by professors/admin when student finishes a course
   */
  async markCourseCompleted(
    studentId: number,
    courseId: number,
    grade?: string,
  ): Promise<{ message: string; enrollment: StudentCourseSelection }> {
    // Find the active enrollment
    const enrollment = await this.studentCourseSelectionRepository.findOne({
      where: {
        studentId,
        courseId,
        status: EnrollmentStatus.ENROLLED,
      },
      relations: ['student', 'course'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        `No active enrollment found for student ${studentId} in course ${courseId}`,
      );
    }

    // Mark as completed and save grade
    enrollment.status = EnrollmentStatus.COMPLETED;
    if (grade) {
      enrollment.grade = grade;
    }
    
    // Save the completion
    const completedEnrollment = await this.studentCourseSelectionRepository.save(enrollment);

    return {
      message: `Course ${enrollment.course.code} marked as completed for student ${enrollment.student.name}${grade ? ` with grade ${grade}` : ''}`,
      enrollment: completedEnrollment,
    };
  }

  /**
   * Get student's completed courses (for prerequisites checking)
   */
  async getStudentCompletedCourses(studentId: number): Promise<Course[]> {
    const completedEnrollments = await this.studentCourseSelectionRepository.find({
      where: {
        studentId,
        status: EnrollmentStatus.COMPLETED,
      },
      relations: ['course'],
    });

    return completedEnrollments.map(enrollment => enrollment.course);
  }

  /**
   * Get student's completed courses with grades (for admin interface)
   */
  async getStudentCompletedCoursesWithGrades(studentId: number): Promise<StudentCourseSelection[]> {
    return await this.studentCourseSelectionRepository.find({
      where: {
        studentId,
        status: EnrollmentStatus.COMPLETED,
      },
      relations: ['course'],
    });
  }

  /**
   * Bulk complete courses for semester end
   */
  async bulkCompleteCourses(
    completions: Array<{ studentId: number; courseId: number; grade?: string }>,
  ): Promise<{ message: string; completed: number }> {
    let completedCount = 0;

    for (const completion of completions) {
      try {
        await this.markCourseCompleted(
          completion.studentId,
          completion.courseId,
          completion.grade,
        );
        completedCount++;
      } catch (error) {
        console.warn(`Failed to complete course for student ${completion.studentId}: ${error.message}`);
      }
    }

    return {
      message: `Bulk completion processed: ${completedCount}/${completions.length} courses completed`,
      completed: completedCount,
    };
  }
}
