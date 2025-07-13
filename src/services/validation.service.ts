import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { 
  TimetableConflict, 
  ValidationResult, 
  Timetable, 
  Course,
  DayOfWeek 
} from '../types/interfaces';

export interface EnrollmentConfig {
  collegeId: number;
  maxCreditHoursPerSemester: number;
  maxStudyHoursPerDay: number;
  minBreakTimeBetweenClasses: number;
  maxCoursesPerSemester: number;
  allowOvernightClasses: boolean;
  allowWeekendClasses: boolean;
}

@Injectable()
export class ValidationService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Enhanced enrollment validation with comprehensive edge case coverage
   */
  async validateEnrollmentEdgeCases(
    studentId: number,
    courseIds: number[]
  ): Promise<ValidationResult> {
    const violations: string[] = [];

    try {
      // Get student's college and enrollment config
      const studentInfo = await this.getStudentInfo(studentId);
      const config = await this.getEnrollmentConfig(studentInfo.collegeId);

      // Get course and timetable information
      const coursesInfo = await this.getCoursesInfo(courseIds);
      const timetablesInfo = await this.getTimetablesInfo(courseIds);

      // 1. College constraint validation
      const collegeValidation = await this.validateSameCollegeMultiple(studentId, courseIds);
      if (!collegeValidation.isValid && collegeValidation.message) {
        violations.push(collegeValidation.message);
      }

      // 2. Prerequisites validation
      const prerequisitesValidation = await this.validatePrerequisitesEnhanced(studentId, courseIds);
      violations.push(...prerequisitesValidation.violations);

      // 3. Course capacity validation
      const capacityValidation = await this.validateCourseCapacityMultiple(courseIds);
      violations.push(...capacityValidation.violations);

      // 4. Credit hours limit validation
      const creditHoursValidation = await this.validateCreditHoursLimit(
        studentId, 
        coursesInfo, 
        config.maxCreditHoursPerSemester
      );
      violations.push(...creditHoursValidation.violations);

      // 5. Maximum courses per semester validation
      const maxCoursesValidation = await this.validateMaxCoursesPerSemester(
        studentId, 
        courseIds, 
        config.maxCoursesPerSemester
      );
      violations.push(...maxCoursesValidation.violations);

      // 6. Overnight classes policy validation
      const overnightValidation = await this.validateOvernightClassesPolicy(
        timetablesInfo, 
        config.allowOvernightClasses
      );
      violations.push(...overnightValidation.violations);

      // 7. Enhanced timetable conflicts (including overnight and cross-day)
      const timetableValidation = await this.validateEnhancedTimetableConflicts(
        studentId, 
        timetablesInfo
      );
      violations.push(...timetableValidation.violations);

      // 8. Buffer time validation
      const bufferTimeValidation = await this.validateBufferTime(
        studentId, 
        timetablesInfo, 
        config.minBreakTimeBetweenClasses
      );
      violations.push(...bufferTimeValidation.violations);

      // 9. Daily study hours validation
      const studyHoursValidation = await this.validateDailyStudyHours(
        studentId, 
        timetablesInfo, 
        config.maxStudyHoursPerDay
      );
      violations.push(...studyHoursValidation.violations);

      return {
        isValid: violations.length === 0,
        message: violations.length === 0 ? 'All validations passed' : 'Validation failed',
        violations: violations
      };

    } catch (error) {
      return {
        isValid: false,
        message: `Validation error: ${error.message}`,
        violations: [`Internal validation error: ${error.message}`]
      };
    }
  }

  /**
   * Legacy single course validation method (for backward compatibility)
   */
  async validateEnrollment(
    studentId: number, 
    courseId: number
  ): Promise<ValidationResult> {
    return this.validateEnrollmentEdgeCases(studentId, [courseId]);
  }

  /**
   * Validate timetable creation for a new course
   */
  async validateTimetableCreation(timetableData: any): Promise<ValidationResult> {
    try {
      // Check if course exists
      const courseQuery = 'SELECT id, code, name FROM courses WHERE id = $1';
      const courseResult = await this.databaseService.query(courseQuery, [timetableData.courseId]);
      
      if (courseResult.rows.length === 0) {
        return {
          isValid: false,
          message: `Course with ID ${timetableData.courseId} not found`,
          violations: [`Course with ID ${timetableData.courseId} does not exist`]
        };
      }

      // Check for conflicts with existing timetables
      const conflictQuery = `
        SELECT 
          t.id,
          t.course_id,
          t.day_of_week,
          t.start_time,
          t.end_time,
          t.room,
          c.code,
          c.name
        FROM timetables t
        JOIN courses c ON t.course_id = c.id
        WHERE t.day_of_week = $1 
        AND (
          (t.start_time <= $2 AND t.end_time > $2) OR
          (t.start_time < $3 AND t.end_time >= $3) OR
          (t.start_time >= $2 AND t.end_time <= $3)
        )
        AND t.room = $4
      `;
      
      const conflicts = await this.databaseService.query(conflictQuery, [
        timetableData.dayOfWeek,
        timetableData.startTime,
        timetableData.endTime,
        timetableData.room
      ]);

      if (conflicts.rows.length > 0) {
        const conflictMessages = conflicts.rows.map(row => 
          `Room ${row.room} is occupied by ${row.code} (${row.name}) on ${row.day_of_week} from ${row.start_time} to ${row.end_time}`
        );
        
        return {
          isValid: false,
          message: 'Timetable conflicts detected',
          violations: conflictMessages,
          conflicts: conflicts.rows
        };
      }

      return {
        isValid: true,
        message: 'Timetable validation successful',
        violations: []
      };

    } catch (error) {
      return {
        isValid: false,
        message: `Timetable validation error: ${error.message}`,
        violations: [`Internal validation error: ${error.message}`]
      };
    }
  }

  /**
   * Public method to validate buffer time for a single course
   */
  async validateSingleCourseBufferTime(
    studentId: number, 
    courseId: number
  ): Promise<ValidationResult> {
    try {
      const studentInfo = await this.getStudentInfo(studentId);
      const config = await this.getEnrollmentConfig(studentInfo.collegeId);
      const timetablesInfo = await this.getTimetablesInfo([courseId]);
      
      const bufferValidation = await this.validateBufferTime(
        studentId,
        timetablesInfo,
        config.minBreakTimeBetweenClasses
      );

      return {
        isValid: bufferValidation.violations.length === 0,
        message: bufferValidation.violations.length === 0 ? 'Buffer time validation passed' : 'Buffer time validation failed',
        violations: bufferValidation.violations
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Buffer time validation error: ${error.message}`,
        violations: [`Internal validation error: ${error.message}`]
      };
    }
  }

  /**
   * Get student information including college
   */
  private async getStudentInfo(studentId: number): Promise<{id: number, collegeId: number}> {
    const query = 'SELECT id, college_id FROM students WHERE id = $1';
    const result = await this.databaseService.query(query, [studentId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    return {
      id: result.rows[0].id,
      collegeId: result.rows[0].college_id
    };
  }

  /**
   * Get enrollment configuration for a college
   */
  private async getEnrollmentConfig(collegeId: number): Promise<EnrollmentConfig> {
    const query = `
      SELECT 
        college_id,
        max_credit_hours_per_semester,
        max_study_hours_per_day,
        min_break_time_between_classes,
        max_courses_per_semester,
        allow_overnight_classes,
        allow_weekend_classes
      FROM enrollment_configs 
      WHERE college_id = $1
    `;
    
    const result = await this.databaseService.query(query, [collegeId]);
    
    if (result.rows.length === 0) {
      // Return default configuration if none exists
      return {
        collegeId: collegeId,
        maxCreditHoursPerSemester: 18,
        maxStudyHoursPerDay: 8,
        minBreakTimeBetweenClasses: 15,
        maxCoursesPerSemester: 6,
        allowOvernightClasses: false,
        allowWeekendClasses: true
      };
    }
    
    const row = result.rows[0];
    return {
      collegeId: row.college_id,
      maxCreditHoursPerSemester: row.max_credit_hours_per_semester,
      maxStudyHoursPerDay: row.max_study_hours_per_day,
      minBreakTimeBetweenClasses: row.min_break_time_between_classes,
      maxCoursesPerSemester: row.max_courses_per_semester,
      allowOvernightClasses: row.allow_overnight_classes,
      allowWeekendClasses: row.allow_weekend_classes
    };
  }

  /**
   * Get course information
   */
  private async getCoursesInfo(courseIds: number[]): Promise<any[]> {
    if (courseIds.length === 0) return [];
    
    const placeholders = courseIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT id, code, name, credits, college_id, max_capacity, prerequisites
      FROM courses 
      WHERE id IN (${placeholders})
    `;
    
    const result = await this.databaseService.query(query, courseIds);
    return result.rows;
  }

  /**
   * Get timetable information including overnight class details
   */
  private async getTimetablesInfo(courseIds: number[]): Promise<any[]> {
    if (courseIds.length === 0) return [];
    
    const placeholders = courseIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT 
        t.id,
        t.course_id,
        t.day_of_week,
        t.start_time,
        t.end_time,
        t.is_overnight_class,
        t.room,
        c.code,
        c.name
      FROM timetables t
      JOIN courses c ON t.course_id = c.id
      WHERE t.course_id IN (${placeholders})
      ORDER BY t.day_of_week, t.start_time
    `;
    
    const result = await this.databaseService.query(query, courseIds);
    return result.rows;
  }

  /**
   * Validate same college constraint for multiple courses
   */
  private async validateSameCollegeMultiple(studentId: number, courseIds: number[]): Promise<ValidationResult> {
    if (courseIds.length === 0) return { isValid: true };

    const query = `
      SELECT DISTINCT c.college_id
      FROM courses c
      WHERE c.id = ANY($1::int[])
      AND c.college_id != (SELECT college_id FROM students WHERE id = $2)
    `;
    
    const result = await this.databaseService.query(query, [courseIds, studentId]);
    
    if (result.rows.length > 0) {
      return {
        isValid: false,
        message: 'One or more courses do not belong to the same college as the student'
      };
    }
    
    return { isValid: true };
  }

  /**
   * Enhanced prerequisites validation
   */
  private async validatePrerequisitesEnhanced(studentId: number, courseIds: number[]): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    for (const courseId of courseIds) {
      // Check both old format (prerequisites text column) and new format (course_prerequisites table)
      const query = `
        WITH course_prereqs AS (
          -- New format: from course_prerequisites table
          SELECT cp.prerequisite_course_id, cp.minimum_grade, cp.is_mandatory
          FROM course_prerequisites cp
          WHERE cp.course_id = $1
          
          UNION
          
          -- Old format: from prerequisites text column (comma-separated)
          SELECT 
            CAST(unnest(string_to_array(c.prerequisites, ',')) AS INTEGER) as prerequisite_course_id,
            'C' as minimum_grade,
            true as is_mandatory
          FROM courses c
          WHERE c.id = $1 AND c.prerequisites IS NOT NULL AND c.prerequisites != ''
        ),
        completed_courses AS (
          SELECT course_id, grade
          FROM student_course_selections
          WHERE student_id = $2 AND is_completed = true
        )
        SELECT 
          cp.prerequisite_course_id,
          cp.minimum_grade,
          cp.is_mandatory,
          cc.course_id as completed_course_id,
          cc.grade as completed_grade,
          c.code,
          c.name
        FROM course_prereqs cp
        LEFT JOIN completed_courses cc ON cp.prerequisite_course_id = cc.course_id
        LEFT JOIN courses c ON cp.prerequisite_course_id = c.id
        WHERE cp.is_mandatory = true AND cc.course_id IS NULL
      `;
      
      const result = await this.databaseService.query(query, [courseId, studentId]);
      
      if (result.rows.length > 0) {
        const missingPrereqs = result.rows.map(row => `${row.code} (${row.name})`).join(', ');
        violations.push(`Course ${courseId} requires completion of prerequisite courses: ${missingPrereqs}`);
      }
    }
    
    return { violations };
  }

  /**
   * Validate course capacity for multiple courses
   */
  private async validateCourseCapacityMultiple(courseIds: number[]): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    const query = `
      SELECT 
        c.id,
        c.code,
        c.name,
        c.max_capacity,
        COUNT(scs.course_id) as current_enrollment
      FROM courses c
      LEFT JOIN student_course_selections scs ON c.id = scs.course_id AND scs.is_completed = false
      WHERE c.id = ANY($1::int[])
      GROUP BY c.id, c.code, c.name, c.max_capacity
      HAVING COUNT(scs.course_id) >= c.max_capacity
    `;
    
    const result = await this.databaseService.query(query, [courseIds]);
    
    for (const row of result.rows) {
      violations.push(
        `Course ${row.code} (${row.name}) is at full capacity (${row.current_enrollment}/${row.max_capacity} students)`
      );
    }
    
    return { violations };
  }

  /**
   * Validate credit hours limit
   */
  private async validateCreditHoursLimit(
    studentId: number, 
    coursesInfo: any[], 
    maxCreditHours: number
  ): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    // Get current semester credit hours
    const query = `
      SELECT COALESCE(SUM(c.credits), 0) as current_credits
      FROM student_course_selections scs
      JOIN courses c ON scs.course_id = c.id
      WHERE scs.student_id = $1 AND scs.is_completed = false
    `;
    
    const result = await this.databaseService.query(query, [studentId]);
    const currentCredits = parseInt(result.rows[0].current_credits);
    const newCredits = coursesInfo.reduce((sum, course) => sum + (course.credits || 3), 0);
    const totalCredits = currentCredits + newCredits;
    
    if (totalCredits > maxCreditHours) {
      violations.push(
        `Credit hours limit exceeded: ${totalCredits} total credits (maximum: ${maxCreditHours} credits per semester)`
      );
    }
    
    return { violations };
  }

  /**
   * Validate maximum courses per semester
   */
  private async validateMaxCoursesPerSemester(
    studentId: number, 
    courseIds: number[], 
    maxCourses: number
  ): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    // Get current course count
    const query = `
      SELECT COUNT(*) as current_courses
      FROM student_course_selections
      WHERE student_id = $1 AND is_completed = false
    `;
    
    const result = await this.databaseService.query(query, [studentId]);
    const currentCourses = parseInt(result.rows[0].current_courses);
    const totalCourses = currentCourses + courseIds.length;
    
    if (totalCourses > maxCourses) {
      violations.push(
        `Maximum courses per semester exceeded: ${totalCourses} total courses (maximum: ${maxCourses} courses)`
      );
    }
    
    return { violations };
  }

  /**
   * Validate overnight classes policy
   */
  private async validateOvernightClassesPolicy(
    timetablesInfo: any[], 
    allowOvernightClasses: boolean
  ): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    if (!allowOvernightClasses) {
      const overnightClasses = timetablesInfo.filter(t => t.is_overnight_class);
      if (overnightClasses.length > 0) {
        violations.push('Overnight classes are not allowed for this college');
      }
    }
    
    return { violations };
  }

  /**
   * Enhanced timetable conflicts including overnight and cross-day validation
   */
  private async validateEnhancedTimetableConflicts(
    studentId: number, 
    newTimetables: any[]
  ): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    // Get existing timetables for the student
    const query = `
      SELECT 
        t.course_id,
        t.day_of_week,
        t.start_time,
        t.end_time,
        t.is_overnight_class,
        c.code,
        c.name
      FROM student_course_selections scs
      JOIN courses c ON scs.course_id = c.id
      JOIN timetables t ON c.id = t.course_id
      WHERE scs.student_id = $1 AND scs.is_completed = false
    `;
    
    const result = await this.databaseService.query(query, [studentId]);
    const existingTimetables = result.rows;
    
    // Check for conflicts between new and existing timetables
    for (const newTimetable of newTimetables) {
      for (const existingTimetable of existingTimetables) {
        if (this.hasEnhancedTimeConflict(newTimetable, existingTimetable)) {
          const conflictType = this.getConflictType(newTimetable, existingTimetable);
          violations.push(
            `${conflictType} conflict: Course ${newTimetable.code} (${newTimetable.day_of_week} ${newTimetable.start_time}-${newTimetable.end_time}) conflicts with existing course ${existingTimetable.code} (${existingTimetable.day_of_week} ${existingTimetable.start_time}-${existingTimetable.end_time})`
          );
        }
      }
    }
    
    // Check for conflicts within new timetables
    for (let i = 0; i < newTimetables.length; i++) {
      for (let j = i + 1; j < newTimetables.length; j++) {
        if (this.hasEnhancedTimeConflict(newTimetables[i], newTimetables[j])) {
          const conflictType = this.getConflictType(newTimetables[i], newTimetables[j]);
          violations.push(
            `${conflictType} conflict: Course ${newTimetables[i].code} conflicts with course ${newTimetables[j].code}`
          );
        }
      }
    }
    
    return { violations };
  }

  /**
   * Enhanced time conflict detection including overnight classes
   */
  private hasEnhancedTimeConflict(timetable1: any, timetable2: any): boolean {
    // Same day conflict check
    if (timetable1.day_of_week === timetable2.day_of_week) {
      return this.timeRangesOverlap(timetable1, timetable2);
    }
    
    // Cross-day conflict check for overnight classes
    return this.hasOvernightConflict(timetable1, timetable2);
  }

  /**
   * Check if time ranges overlap (supports overnight classes)
   */
  private timeRangesOverlap(timetable1: any, timetable2: any): boolean {
    if (timetable1.is_overnight_class || timetable2.is_overnight_class) {
      return this.overnightTimeRangesOverlap(timetable1, timetable2);
    }
    
    // Regular overlap check
    const start1 = this.timeToMinutes(timetable1.start_time);
    const end1 = this.timeToMinutes(timetable1.end_time);
    const start2 = this.timeToMinutes(timetable2.start_time);
    const end2 = this.timeToMinutes(timetable2.end_time);
    
    return start1 < end2 && start2 < end1;
  }

  /**
   * Overnight time ranges overlap logic
   */
  private overnightTimeRangesOverlap(timetable1: any, timetable2: any): boolean {
    const start1 = this.timeToMinutes(timetable1.start_time);
    const end1 = this.timeToMinutes(timetable1.end_time);
    const start2 = this.timeToMinutes(timetable2.start_time);
    const end2 = this.timeToMinutes(timetable2.end_time);
    
    if (timetable1.is_overnight_class && timetable2.is_overnight_class) {
      // Both overnight: check both evening and morning portions
      const evening1Overlaps = start1 < 1440 && start2 < 1440 && Math.max(start1, start2) < 1440;
      const morning1Overlaps = end1 > 0 && end2 > 0 && Math.min(end1, end2) > 0;
      return evening1Overlaps || morning1Overlaps;
    }
    
    if (timetable1.is_overnight_class) {
      // timetable1 is overnight, timetable2 is regular
      return (start2 >= start1 || end2 > start1) || (start2 < end1 || end2 <= end1);
    }
    
    if (timetable2.is_overnight_class) {
      // timetable2 is overnight, timetable1 is regular
      return (start1 >= start2 || end1 > start2) || (start1 < end2 || end1 <= end2);
    }
    
    return false;
  }

  /**
   * Check for overnight conflicts between adjacent days
   */
  private hasOvernightConflict(timetable1: any, timetable2: any): boolean {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const day1Index = days.indexOf(timetable1.day_of_week);
    const day2Index = days.indexOf(timetable2.day_of_week);
    
    // Check if days are adjacent
    const isNextDay = (day1Index + 1) % 7 === day2Index;
    const isPrevDay = (day2Index + 1) % 7 === day1Index;
    
    if (isNextDay && timetable1.is_overnight_class) {
      // timetable1 is overnight and extends into timetable2's day
      const class1End = this.timeToMinutes(timetable1.end_time);
      const class2Start = this.timeToMinutes(timetable2.start_time);
      return class1End > class2Start;
    }
    
    if (isPrevDay && timetable2.is_overnight_class) {
      // timetable2 is overnight and extends into timetable1's day
      const class2End = this.timeToMinutes(timetable2.end_time);
      const class1Start = this.timeToMinutes(timetable1.start_time);
      return class2End > class1Start;
    }
    
    return false;
  }

  /**
   * Get conflict type for better error messages
   */
  private getConflictType(timetable1: any, timetable2: any): string {
    if (timetable1.day_of_week === timetable2.day_of_week) {
      if (timetable1.is_overnight_class || timetable2.is_overnight_class) {
        return 'Overnight';
      }
      return 'Timetable';
    }
    return 'Cross-day';
  }

  /**
   * Validate buffer time between consecutive classes
   */
  private async validateBufferTime(
    studentId: number, 
    newTimetables: any[], 
    minBufferMinutes: number
  ): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    // Get existing timetables
    const query = `
      SELECT 
        t.day_of_week,
        t.start_time,
        t.end_time,
        t.is_overnight_class,
        c.code
      FROM student_course_selections scs
      JOIN courses c ON scs.course_id = c.id
      JOIN timetables t ON c.id = t.course_id
      WHERE scs.student_id = $1 AND scs.is_completed = false
    `;
    
    const result = await this.databaseService.query(query, [studentId]);
    const allTimetables = [...result.rows, ...newTimetables];
    
    // Group by day and check buffer times
    const timetablesByDay = this.groupTimetablesByDay(allTimetables);
    
    for (const [day, dayTimetables] of Object.entries(timetablesByDay)) {
      const sortedTimetables = dayTimetables
        .filter(t => !t.is_overnight_class)
        .sort((a, b) => this.timeToMinutes(a.start_time) - this.timeToMinutes(b.start_time));
      
      for (let i = 0; i < sortedTimetables.length - 1; i++) {
        const current = sortedTimetables[i];
        const next = sortedTimetables[i + 1];
        
        const currentEnd = this.timeToMinutes(current.end_time);
        const nextStart = this.timeToMinutes(next.start_time);
        const bufferTime = nextStart - currentEnd;
        
        if (bufferTime < minBufferMinutes) {
          violations.push(
            `Insufficient buffer time on ${day}: only ${bufferTime} minutes between ${current.end_time} and ${next.start_time} (minimum: ${minBufferMinutes} minutes)`
          );
        }
      }
    }
    
    return { violations };
  }

  /**
   * Validate daily study hours including overnight classes
   */
  private async validateDailyStudyHours(
    studentId: number, 
    newTimetables: any[], 
    maxHours: number
  ): Promise<{violations: string[]}> {
    const violations: string[] = [];
    
    // Get existing timetables
    const query = `
      SELECT 
        t.day_of_week,
        t.start_time,
        t.end_time,
        t.is_overnight_class
      FROM student_course_selections scs
      JOIN courses c ON scs.course_id = c.id
      JOIN timetables t ON c.id = t.course_id
      WHERE scs.student_id = $1 AND scs.is_completed = false
    `;
    
    const result = await this.databaseService.query(query, [studentId]);
    const allTimetables = [...result.rows, ...newTimetables];
    
    // Calculate hours per day
    const hoursByDay = this.calculateHoursByDay(allTimetables);
    
    for (const [day, hours] of Object.entries(hoursByDay)) {
      if (hours > maxHours) {
        violations.push(
          `Daily study hours exceeded on ${day}: ${hours.toFixed(1)} hours (maximum: ${maxHours} hours)`
        );
      }
    }
    
    return { violations };
  }

  /**
   * Group timetables by day
   */
  private groupTimetablesByDay(timetables: any[]): Record<string, any[]> {
    return timetables.reduce((acc, timetable) => {
      const day = timetable.day_of_week;
      if (!acc[day]) acc[day] = [];
      acc[day].push(timetable);
      return acc;
    }, {});
  }

  /**
   * Calculate total hours per day including overnight classes
   */
  private calculateHoursByDay(timetables: any[]): Record<string, number> {
    const hoursByDay: Record<string, number> = {};
    
    for (const timetable of timetables) {
      const day = timetable.day_of_week;
      if (!hoursByDay[day]) hoursByDay[day] = 0;
      
      let duration: number;
      if (timetable.is_overnight_class) {
        // For overnight classes, calculate duration across midnight
        const startMinutes = this.timeToMinutes(timetable.start_time);
        const endMinutes = this.timeToMinutes(timetable.end_time);
        duration = (1440 - startMinutes) + endMinutes; // 1440 = 24 * 60
      } else {
        const startMinutes = this.timeToMinutes(timetable.start_time);
        const endMinutes = this.timeToMinutes(timetable.end_time);
        duration = endMinutes - startMinutes;
      }
      
      hoursByDay[day] += duration / 60; // Convert to hours
    }
    
    return hoursByDay;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
