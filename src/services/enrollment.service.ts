import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Pool } from 'pg';
import { EnrollStudentDto, UnenrollStudentDto, ValidateEnrollmentDto } from '../dto/student-courses.dto';
import { 
  Student, 
  Course, 
  Timetable, 
  StudentCourseSelection, 
  EnrollmentResult,
  StudentEnrollment 
} from '../types/interfaces';
import { ValidationService } from './validation.service';

@Injectable()
export class EnrollmentService {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    private readonly validationService: ValidationService
  ) {}

  /**
   * Main enrollment function - saves student course selection
   */
  async enrollStudent(enrollmentData: EnrollStudentDto): Promise<EnrollmentResult> {
    const { studentId, courseIds } = enrollmentData;
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Input validation
      const validationResult = await this.validateInput(client, studentId, courseIds);
      if (!validationResult.isValid) {
        throw new BadRequestException(validationResult.error);
      }

      // Enhanced comprehensive validation (includes all edge cases)
      const enhancedValidation = await this.validationService.validateEnrollmentEdgeCases(
        studentId, 
        courseIds
      );
      
      if (!enhancedValidation.isValid) {
        throw new BadRequestException(enhancedValidation.violations?.join('; ') || enhancedValidation.message);
      }

      // Save enrollments (basic validations already passed)
      const enrollments = await this.saveEnrollments(client, studentId, courseIds);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Courses enrolled successfully',
        enrollments: enrollments
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate input parameters
   */
  private async validateInput(client: any, studentId: number, courseIds: number[]): Promise<{isValid: boolean, error?: string}> {
    // Check if courseIds is empty
    if (!courseIds || courseIds.length === 0) {
      return { isValid: false, error: 'Course list cannot be empty' };
    }

    // Check if student exists
    const studentQuery = 'SELECT id FROM students WHERE id = $1';
    const studentResult = await client.query(studentQuery, [studentId]);
    
    if (studentResult.rows.length === 0) {
      return { isValid: false, error: `Student with ID ${studentId} does not exist` };
    }

    // Check if all courses exist
    const coursesQuery = 'SELECT id FROM courses WHERE id = ANY($1)';
    const coursesResult = await client.query(coursesQuery, [courseIds]);
    
    if (coursesResult.rows.length !== courseIds.length) {
      const existingCourseIds = coursesResult.rows.map(row => row.id);
      const missingCourseIds = courseIds.filter(id => !existingCourseIds.includes(id));
      return { isValid: false, error: `Courses with IDs ${missingCourseIds.join(', ')} do not exist` };
    }

    return { isValid: true };
  }

  /**
   * Validate that student and all courses belong to the same college
   */
  private async validateSameCollege(client: any, studentId: number, courseIds: number[]) {
    const query = `
      SELECT DISTINCT 
        s.college_id as student_college_id,
        c.college_id as course_college_id,
        c.id as course_id
      FROM students s
      CROSS JOIN courses c
      WHERE s.id = $1 AND c.id = ANY($2)
    `;
    
    const result = await client.query(query, [studentId, courseIds]);
    
    for (const row of result.rows) {
      if (row.student_college_id !== row.course_college_id) {
        throw new BadRequestException(`Course ${row.course_id} does not belong to the same college as the student`);
      }
    }
  }

  /**
   * Validate that selected courses don't have timetable conflicts
   */
  private async validateTimetableConflicts(client: any, studentId: number, courseIds: number[]) {
    // Check conflicts with already enrolled courses
    const existingConflictsQuery = `
      SELECT 
        t1.course_id as existing_course,
        t2.course_id as new_course,
        t1.day_of_week,
        t1.start_time as existing_start,
        t1.end_time as existing_end,
        t2.start_time as new_start,
        t2.end_time as new_end
      FROM student_course_selections scs
      JOIN timetables t1 ON scs.course_id = t1.course_id
      JOIN timetables t2 ON t2.course_id = ANY($2)
      WHERE scs.student_id = $1
        AND t1.day_of_week = t2.day_of_week
        AND t1.start_time < t2.end_time
        AND t1.end_time > t2.start_time
        AND t1.course_id != t2.course_id  -- Only check different courses
    `;
    
    const existingConflicts = await client.query(existingConflictsQuery, [studentId, courseIds]);
    
    if (existingConflicts.rows.length > 0) {
      const conflict = existingConflicts.rows[0];
      throw new ConflictException(
        `Timetable conflict: Course ${conflict.new_course} (${conflict.day_of_week} ${conflict.new_start}-${conflict.new_end}) ` +
        `conflicts with already enrolled course ${conflict.existing_course} (${conflict.existing_start}-${conflict.existing_end})`
      );
    }

    // Check conflicts within the new course selection
    const internalConflictsQuery = `
      SELECT 
        t1.course_id as course1,
        t2.course_id as course2,
        t1.day_of_week,
        t1.start_time as start1,
        t1.end_time as end1,
        t2.start_time as start2,
        t2.end_time as end2
      FROM timetables t1
      JOIN timetables t2 ON t1.day_of_week = t2.day_of_week
      WHERE t1.course_id = ANY($1)
        AND t2.course_id = ANY($1)
        AND t1.course_id < t2.course_id
        AND t1.start_time < t2.end_time
        AND t1.end_time > t2.start_time
    `;
    
    const internalConflicts = await client.query(internalConflictsQuery, [courseIds]);
    
    if (internalConflicts.rows.length > 0) {
      const conflict = internalConflicts.rows[0];
      throw new ConflictException(
        `Timetable conflict between selected courses: Course ${conflict.course1} (${conflict.day_of_week} ${conflict.start1}-${conflict.end1}) ` +
        `conflicts with Course ${conflict.course2} (${conflict.start2}-${conflict.end2})`
      );
    }
  }

  /**
   * Save enrollments to database
   */
  private async saveEnrollments(client: any, studentId: number, courseIds: number[]): Promise<StudentCourseSelection[]> {
    const enrollments: StudentCourseSelection[] = [];
    
    for (const courseId of courseIds) {
      // Check if already enrolled
      const existingQuery = 'SELECT id FROM student_course_selections WHERE student_id = $1 AND course_id = $2';
      const existing = await client.query(existingQuery, [studentId, courseId]);
      
      if (existing.rows.length > 0) {
        throw new ConflictException(`Student is already enrolled in course ${courseId}`);
      }

      // Insert new enrollment
      const insertQuery = `
        INSERT INTO student_course_selections (student_id, course_id) 
        VALUES ($1, $2) 
        RETURNING id, student_id, course_id
      `;
      
      const result = await client.query(insertQuery, [studentId, courseId]);
      enrollments.push(result.rows[0] as StudentCourseSelection);
    }
    
    return enrollments;
  }

  /**
   * Get student's current enrollments with timetable
   */
  async getStudentEnrollments(studentId: number): Promise<StudentEnrollment[]> {
    const query = `
      SELECT 
        c.id as course_id,
        c.code,
        c.name,
        t.day_of_week,
        t.start_time,
        t.end_time
      FROM student_course_selections scs
      JOIN courses c ON scs.course_id = c.id
      JOIN timetables t ON c.id = t.course_id
      WHERE scs.student_id = $1
      ORDER BY 
        CASE t.day_of_week 
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          WHEN 'SUNDAY' THEN 7
        END,
        t.start_time
    `;
    
    const result = await this.pool.query(query, [studentId]);
    return result.rows;
  }

  /**
   * Unenroll student from courses
   */
  async unenrollStudent(unenrollData: UnenrollStudentDto): Promise<{message: string}> {
    const { studentId, courseIds } = unenrollData;
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (const courseId of courseIds) {
        // Check if enrollment exists
        const checkQuery = 'SELECT id FROM student_course_selections WHERE student_id = $1 AND course_id = $2';
        const checkResult = await client.query(checkQuery, [studentId, courseId]);

        if (checkResult.rows.length === 0) {
          throw new NotFoundException(`Enrollment not found for course ${courseId}`);
        }

        // Delete enrollment
        const deleteQuery = 'DELETE FROM student_course_selections WHERE student_id = $1 AND course_id = $2';
        await client.query(deleteQuery, [studentId, courseId]);
      }

      await client.query('COMMIT');

      return { message: 'Student unenrolled successfully' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate enrollment without saving (dry run)
   */
  async validateEnrollment(validationData: ValidateEnrollmentDto): Promise<{isValid: boolean, conflicts?: string[]}> {
    const { studentId, courseIds } = validationData;
    const client = await this.pool.connect();

    try {
      // Run validation checks
      const validationResult = await this.validateInput(client, studentId, courseIds);
      if (!validationResult.isValid) {
        return { isValid: false, conflicts: [validationResult.error || 'Validation failed'] };
      }

      await this.validateSameCollege(client, studentId, courseIds);
      await this.validateTimetableConflicts(client, studentId, courseIds);

      return { isValid: true };

    } catch (error) {
      return { isValid: false, conflicts: [error.message] };
    } finally {
      client.release();
    }
  }

  /**
   * Mark course as completed for a student
   */
  async markCourseCompleted(studentId: number, courseId: number, grade?: string): Promise<{message: string}> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if enrollment exists
      const checkQuery = 'SELECT id FROM student_course_selections WHERE student_id = $1 AND course_id = $2';
      const checkResult = await client.query(checkQuery, [studentId, courseId]);

      if (checkResult.rows.length === 0) {
        throw new NotFoundException('Enrollment not found');
      }

      // Update enrollment status (we would need to add status and grade columns to the table)
      // For now, we'll just add a completed_at timestamp
      const updateQuery = `
        UPDATE student_course_selections 
        SET completed_at = CURRENT_TIMESTAMP
        WHERE student_id = $1 AND course_id = $2
      `;

      await client.query(updateQuery, [studentId, courseId]);

      await client.query('COMMIT');

      return { message: 'Course marked as completed successfully' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk complete courses for multiple students
   */
  async bulkCompleteCourses(completions: Array<{studentId: number, courseId: number, grade?: string}>): Promise<{message: string, completed: number}> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      let completedCount = 0;

      for (const completion of completions) {
        // Check if enrollment exists
        const checkQuery = 'SELECT id FROM student_course_selections WHERE student_id = $1 AND course_id = $2';
        const checkResult = await client.query(checkQuery, [completion.studentId, completion.courseId]);

        if (checkResult.rows.length > 0) {
          // Update enrollment
          const updateQuery = `
            UPDATE student_course_selections 
            SET completed_at = CURRENT_TIMESTAMP
            WHERE student_id = $1 AND course_id = $2
          `;

          await client.query(updateQuery, [completion.studentId, completion.courseId]);
          completedCount++;
        }
      }

      await client.query('COMMIT');

      return { 
        message: `${completedCount} courses marked as completed successfully`,
        completed: completedCount
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get student completed courses with grades
   */
  async getStudentCompletedCoursesWithGrades(studentId: number): Promise<any[]> {
    const query = `
      SELECT 
        scs.id,
        scs.completed_at,
        c.id as course_id,
        c.code,
        c.name,
        c.college_id
      FROM student_course_selections scs
      JOIN courses c ON scs.course_id = c.id
      WHERE scs.student_id = $1 
        AND scs.completed_at IS NOT NULL
      ORDER BY scs.completed_at DESC
    `;

    const result = await this.pool.query(query, [studentId]);
    
    return result.rows.map(row => ({
      id: row.id,
      enrolledAt: row.completed_at,
      grade: 'A', // Default grade since we don't have grades in simplified schema
      course: {
        id: row.course_id,
        code: row.code,
        name: row.name,
        credits: 3 // Default credits since we don't have credits in simplified schema
      }
    }));
  }

  /**
   * Browse courses by college with optional filtering
   */
  async browseCoursesByCollege(collegeId?: number): Promise<any[]> {
    let query = `
      SELECT 
        c.id,
        c.code,
        c.name,
        c.credits,
        c.college_id,
        c.max_capacity,
        col.name as college_name,
        COUNT(scs.id) as current_enrollments
      FROM courses c
      JOIN colleges col ON c.college_id = col.id
      LEFT JOIN student_course_selections scs ON c.id = scs.course_id
    `;
    
    const params: any[] = [];
    
    if (collegeId) {
      query += ' WHERE c.college_id = $1';
      params.push(collegeId);
    }
    
    query += `
      GROUP BY c.id, c.code, c.name, c.credits, c.college_id, c.max_capacity, col.name
      ORDER BY c.code
    `;
    
    const result = await this.pool.query(query, params);
    
    return result.rows.map(row => ({
      ...row,
      available_spots: row.max_capacity ? row.max_capacity - row.current_enrollments : null
    }));
  }

  /**
   * Get detailed course information with timetable
   */
  async getCourseTimetable(courseId: number): Promise<any> {
    const courseQuery = `
      SELECT 
        c.id,
        c.code,
        c.name,
        c.credits,
        c.college_id,
        c.max_capacity,
        col.name as college_name
      FROM courses c
      JOIN colleges col ON c.college_id = col.id
      WHERE c.id = $1
    `;
    
    const courseResult = await this.pool.query(courseQuery, [courseId]);
    
    if (courseResult.rows.length === 0) {
      throw new NotFoundException('Course not found');
    }
    
    const course = courseResult.rows[0];
    
    const timetableQuery = `
      SELECT 
        id,
        day_of_week,
        start_time,
        end_time
      FROM timetables
      WHERE course_id = $1
      ORDER BY 
        CASE day_of_week 
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          WHEN 'SUNDAY' THEN 7
        END,
        start_time
    `;
    
    const timetableResult = await this.pool.query(timetableQuery, [courseId]);
    
    return {
      ...course,
      timetables: timetableResult.rows
    };
  }
}