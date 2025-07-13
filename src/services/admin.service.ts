import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Pool } from 'pg';
import { CreateTimetableDto } from '../dto/create-timetable.dto';
import { CreateCollegeDto } from '../dto/create-college.dto';
import { CreateStudentDto } from '../dto/create-student.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { 
  College, 
  Student, 
  Course, 
  Timetable, 
  CourseWithTimetable 
} from '../types/interfaces';

@Injectable()
export class AdminService {
  constructor(
    @Inject('DATABASE_POOL')
    private pool: Pool,
  ) {}

  /**
   * Create a new college
   */
  async createCollege(collegeData: CreateCollegeDto): Promise<College> {
    const { name } = collegeData;
    
    const query = `
      INSERT INTO colleges (name) 
      VALUES ($1) 
      RETURNING id, name
    `;
    
    try {
      const result = await this.pool.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('College name already exists');
      }
      throw error;
    }
  }

  /**
   * Create a new student
   */
  async createStudent(studentData: CreateStudentDto): Promise<Student> {
    const { studentId, name, collegeId } = studentData;
    
    // Check if college exists
    const collegeQuery = 'SELECT id FROM colleges WHERE id = $1';
    const collegeResult = await this.pool.query(collegeQuery, [collegeId]);
    
    if (collegeResult.rows.length === 0) {
      throw new NotFoundException('College not found');
    }
    
    const query = `
      INSERT INTO students (student_id, name, college_id) 
      VALUES ($1, $2, $3) 
      RETURNING id, student_id, name, college_id
    `;
    
    try {
      const result = await this.pool.query(query, [studentId, name, collegeId]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Student ID already exists');
      }
      throw error;
    }
  }

  /**
   * Create a new course
   */
  async createCourse(courseData: CreateCourseDto): Promise<Course> {
    const { code, name, collegeId } = courseData;
    
    // Check if college exists
    const collegeQuery = 'SELECT id FROM colleges WHERE id = $1';
    const collegeResult = await this.pool.query(collegeQuery, [collegeId]);
    
    if (collegeResult.rows.length === 0) {
      throw new NotFoundException('College not found');
    }
    
    const query = `
      INSERT INTO courses (code, name, college_id) 
      VALUES ($1, $2, $3) 
      RETURNING id, code, name, college_id
    `;
    
    try {
      const result = await this.pool.query(query, [code, name, collegeId]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Course code already exists');
      }
      throw error;
    }
  }

  /**
   * Create a new timetable entry
   */
  async createTimetable(timetableData: CreateTimetableDto): Promise<Timetable> {
    const { courseId, dayOfWeek, startTime, endTime } = timetableData;
    
    // Validate time range
    if (this.timeToMinutes(endTime) <= this.timeToMinutes(startTime)) {
      throw new BadRequestException('End time must be after start time');
    }
    
    // Check if course exists
    const courseQuery = 'SELECT id FROM courses WHERE id = $1';
    const courseResult = await this.pool.query(courseQuery, [courseId]);
    
    if (courseResult.rows.length === 0) {
      throw new NotFoundException('Course not found');
    }
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check for overlapping timetables for the same course
      const sameCourseTimetableQuery = `
        SELECT id, start_time, end_time 
        FROM timetables 
        WHERE course_id = $1 
          AND day_of_week = $2
          AND start_time < $4
          AND end_time > $3
      `;
      
      const sameCourseTimetableResult = await client.query(sameCourseTimetableQuery, [courseId, dayOfWeek, startTime, endTime]);
      
      if (sameCourseTimetableResult.rows.length > 0) {
        const existing = sameCourseTimetableResult.rows[0];
        throw new ConflictException(`Timetable conflict: Course already has a class on ${dayOfWeek} from ${existing.start_time} to ${existing.end_time}, which overlaps with ${startTime}-${endTime}`);
      }
      
      // Check for conflicts with existing enrollments
      const conflictQuery = `
        SELECT COUNT(*) as enrolled_students
        FROM student_course_selections scs
        JOIN timetables t ON scs.course_id = t.course_id
        WHERE t.day_of_week = $1
          AND t.start_time < $3
          AND t.end_time > $2
          AND scs.student_id IN (
            SELECT DISTINCT scs2.student_id 
            FROM student_course_selections scs2 
            WHERE scs2.course_id = $4
          )
      `;
      
      const conflictResult = await client.query(conflictQuery, [dayOfWeek, startTime, endTime, courseId]);
      
      if (parseInt(conflictResult.rows[0].enrolled_students) > 0) {
        throw new ConflictException('Cannot create timetable: would cause conflicts for enrolled students');
      }
      
      // Insert timetable
      const insertQuery = `
        INSERT INTO timetables (course_id, day_of_week, start_time, end_time) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, course_id, day_of_week, start_time, end_time
      `;
      
      const result = await client.query(insertQuery, [courseId, dayOfWeek, startTime, endTime]);
      
      await client.query('COMMIT');
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Timetable entry already exists for this course');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update timetable entry
   */
  async updateTimetable(timetableId: number, updateData: Partial<CreateTimetableDto>): Promise<Timetable> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current timetable
      const currentQuery = 'SELECT * FROM timetables WHERE id = $1';
      const currentResult = await client.query(currentQuery, [timetableId]);
      
      if (currentResult.rows.length === 0) {
        throw new NotFoundException('Timetable not found');
      }
      
      const current = currentResult.rows[0];
      const updates = { ...current, ...updateData };
      
      // Validate time range
      if (this.timeToMinutes(updates.end_time) <= this.timeToMinutes(updates.start_time)) {
        throw new BadRequestException('End time must be after start time');
      }
      
      // Check for conflicts (database trigger will also check this)
      const updateQuery = `
        UPDATE timetables 
        SET day_of_week = $1, start_time = $2, end_time = $3
        WHERE id = $4
        RETURNING id, course_id, day_of_week, start_time, end_time
      `;
      
      const result = await client.query(updateQuery, [
        updates.day_of_week,
        updates.start_time,
        updates.end_time,
        timetableId
      ]);
      
      await client.query('COMMIT');
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete timetable entry
   */
  async deleteTimetable(timetableId: number): Promise<{message: string}> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if any students are enrolled in this course
      const enrollmentQuery = `
        SELECT COUNT(*) as student_count
        FROM student_course_selections scs
        JOIN timetables t ON scs.course_id = t.course_id
        WHERE t.id = $1
      `;
      
      const enrollmentResult = await client.query(enrollmentQuery, [timetableId]);
      
      if (parseInt(enrollmentResult.rows[0].student_count) > 0) {
        throw new ConflictException('Cannot delete timetable: students are enrolled in this course');
      }
      
      // Delete timetable
      const deleteQuery = 'DELETE FROM timetables WHERE id = $1 RETURNING id';
      const deleteResult = await client.query(deleteQuery, [timetableId]);
      
      if (deleteResult.rows.length === 0) {
        throw new NotFoundException('Timetable not found');
      }
      
      await client.query('COMMIT');
      
      return { message: 'Timetable deleted successfully' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update a college
   */
  async updateCollege(collegeId: number, collegeData: CreateCollegeDto): Promise<College> {
    const { name } = collegeData;
    
    const query = `
      UPDATE colleges 
      SET name = $1 
      WHERE id = $2 
      RETURNING id, name
    `;
    
    try {
      const result = await this.pool.query(query, [name, collegeId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException('College not found');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('College name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a college
   */
  async deleteCollege(collegeId: number): Promise<{message: string}> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if college has students or courses
      const checkQuery = `
        SELECT 
          (SELECT COUNT(*) FROM students WHERE college_id = $1) as student_count,
          (SELECT COUNT(*) FROM courses WHERE college_id = $1) as course_count
      `;
      
      const checkResult = await client.query(checkQuery, [collegeId]);
      const { student_count, course_count } = checkResult.rows[0];
      
      if (parseInt(student_count) > 0 || parseInt(course_count) > 0) {
        throw new ConflictException('Cannot delete college with associated students or courses');
      }
      
      // Delete college
      const deleteQuery = 'DELETE FROM colleges WHERE id = $1 RETURNING id';
      const deleteResult = await client.query(deleteQuery, [collegeId]);
      
      if (deleteResult.rows.length === 0) {
        throw new NotFoundException('College not found');
      }
      
      await client.query('COMMIT');
      
      return { message: 'College deleted successfully' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific student
   */
  async getStudent(studentId: number): Promise<Student> {
    const query = `
      SELECT id, student_id, name, college_id 
      FROM students 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [studentId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Student not found');
    }
    
    return result.rows[0];
  }

  /**
   * Update a student
   */
  async updateStudent(studentId: number, studentData: CreateStudentDto): Promise<Student> {
    const { studentId: newStudentId, name, collegeId } = studentData;
    
    // Check if college exists
    const collegeQuery = 'SELECT id FROM colleges WHERE id = $1';
    const collegeResult = await this.pool.query(collegeQuery, [collegeId]);
    
    if (collegeResult.rows.length === 0) {
      throw new NotFoundException('College not found');
    }
    
    const query = `
      UPDATE students 
      SET student_id = $1, name = $2, college_id = $3 
      WHERE id = $4 
      RETURNING id, student_id, name, college_id
    `;
    
    try {
      const result = await this.pool.query(query, [newStudentId, name, collegeId, studentId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException('Student not found');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Student ID already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a student
   */
  async deleteStudent(studentId: number): Promise<{message: string}> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete all enrollments first (CASCADE will handle this, but being explicit)
      await client.query('DELETE FROM student_course_selections WHERE student_id = $1', [studentId]);
      
      // Delete student
      const deleteQuery = 'DELETE FROM students WHERE id = $1 RETURNING id';
      const deleteResult = await client.query(deleteQuery, [studentId]);
      
      if (deleteResult.rows.length === 0) {
        throw new NotFoundException('Student not found');
      }
      
      await client.query('COMMIT');
      
      return { message: 'Student deleted successfully' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific course
   */
  async getCourse(courseId: number): Promise<Course> {
    const query = `
      SELECT id, code, name, college_id 
      FROM courses 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [courseId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Course not found');
    }
    
    return result.rows[0];
  }

  /**
   * Update a course
   */
  async updateCourse(courseId: number, courseData: CreateCourseDto): Promise<Course> {
    const { code, name, collegeId } = courseData;
    
    // Check if college exists
    const collegeQuery = 'SELECT id FROM colleges WHERE id = $1';
    const collegeResult = await this.pool.query(collegeQuery, [collegeId]);
    
    if (collegeResult.rows.length === 0) {
      throw new NotFoundException('College not found');
    }
    
    const query = `
      UPDATE courses 
      SET code = $1, name = $2, college_id = $3 
      WHERE id = $4 
      RETURNING id, code, name, college_id
    `;
    
    try {
      const result = await this.pool.query(query, [code, name, collegeId, courseId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException('Course not found');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('Course code already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a course
   */
  async deleteCourse(courseId: number): Promise<{message: string}> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if course has enrollments
      const enrollmentQuery = `
        SELECT COUNT(*) as enrollment_count
        FROM student_course_selections
        WHERE course_id = $1
      `;
      
      const enrollmentResult = await client.query(enrollmentQuery, [courseId]);
      
      if (parseInt(enrollmentResult.rows[0].enrollment_count) > 0) {
        throw new ConflictException('Cannot delete course with enrollments');
      }
      
      // Delete timetables first (CASCADE will handle this, but being explicit)
      await client.query('DELETE FROM timetables WHERE course_id = $1', [courseId]);
      
      // Delete course
      const deleteQuery = 'DELETE FROM courses WHERE id = $1 RETURNING id';
      const deleteResult = await client.query(deleteQuery, [courseId]);
      
      if (deleteResult.rows.length === 0) {
        throw new NotFoundException('Course not found');
      }
      
      await client.query('COMMIT');
      
      return { message: 'Course deleted successfully' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all colleges
   */
  async getAllColleges(): Promise<College[]> {
    const query = 'SELECT id, name FROM colleges ORDER BY name';
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get all students for a college
   */
  async getStudentsByCollege(collegeId: number): Promise<Student[]> {
    const query = `
      SELECT id, student_id, name, college_id 
      FROM students 
      WHERE college_id = $1 
      ORDER BY student_id
    `;
    const result = await this.pool.query(query, [collegeId]);
    return result.rows;
  }

  /**
   * Get all courses for a college with timetables
   */
  async getCoursesByCollege(collegeId: number): Promise<CourseWithTimetable[]> {
    const query = `
      SELECT 
        c.id, c.code, c.name, c.college_id,
        t.id as timetable_id, t.day_of_week, t.start_time, t.end_time
      FROM courses c
      LEFT JOIN timetables t ON c.id = t.course_id
      WHERE c.college_id = $1
      ORDER BY c.code, t.day_of_week, t.start_time
    `;
    
    const result = await this.pool.query(query, [collegeId]);
    
    // Group timetables by course
    const coursesMap = new Map<number, CourseWithTimetable>();
    
    for (const row of result.rows) {
      if (!coursesMap.has(row.id)) {
        coursesMap.set(row.id, {
          id: row.id,
          code: row.code,
          name: row.name,
          college_id: row.college_id,
          timetables: []
        });
      }
      
      if (row.timetable_id) {
        coursesMap.get(row.id)!.timetables.push({
          id: row.timetable_id,
          course_id: row.id,
          day_of_week: row.day_of_week,
          start_time: row.start_time,
          end_time: row.end_time
        });
      }
    }
    
    return Array.from(coursesMap.values());
  }

  /**
   * Get timetables for a specific course
   */
  async getCourseTimetables(courseId: number): Promise<Timetable[]> {
    // Check if course exists
    const courseQuery = 'SELECT id FROM courses WHERE id = $1';
    const courseResult = await this.pool.query(courseQuery, [courseId]);
    
    if (courseResult.rows.length === 0) {
      throw new NotFoundException('Course not found');
    }
    
    const query = `
      SELECT id, course_id, day_of_week, start_time, end_time, created_at
      FROM timetables 
      WHERE course_id = $1
      ORDER BY day_of_week, start_time
    `;
    
    const result = await this.pool.query(query, [courseId]);
    return result.rows;
  }

  /**
   * Utility function to convert time to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
