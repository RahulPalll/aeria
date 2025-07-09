import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timetable } from '../entities/timetable.entity';
import { Course } from '../entities/course.entity';
import { StudentCourseSelection, EnrollmentStatus } from '../entities/student-course-selection.entity';
import { EnrollmentConfig } from '../entities/enrollment-config.entity';

@Injectable()
export class EnhancedValidationService {
  constructor(
    @InjectRepository(Timetable)
    private timetableRepository: Repository<Timetable>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(StudentCourseSelection)
    private studentCourseSelectionRepository: Repository<StudentCourseSelection>,
    @InjectRepository(EnrollmentConfig)
    private enrollmentConfigRepository: Repository<EnrollmentConfig>,
  ) {}

  /**
   * Enhanced timetable conflict detection with overnight classes support
   */
  findTimetableConflicts(timetables: Timetable[]): string[] {
    const conflicts: string[] = [];

    for (let i = 0; i < timetables.length; i++) {
      for (let j = i + 1; j < timetables.length; j++) {
        const timetable1 = timetables[i];
        const timetable2 = timetables[j];

        // Check if they are on the same day
        if (timetable1.dayOfWeek === timetable2.dayOfWeek) {
          // Check for time overlap with overnight class support
          if (this.timesOverlapWithOvernightSupport(timetable1, timetable2)) {
            conflicts.push(
              `${timetable1.dayOfWeek} ${timetable1.startTime}-${timetable1.endTime} conflicts with ${timetable2.startTime}-${timetable2.endTime}`,
            );
          }
        } else {
          // Check for overnight conflicts across adjacent days
          if (this.checkOvernightConflicts(timetable1, timetable2)) {
            conflicts.push(
              `Overnight conflict: ${timetable1.dayOfWeek} ${timetable1.startTime}-${timetable1.endTime} conflicts with ${timetable2.dayOfWeek} ${timetable2.startTime}-${timetable2.endTime}`,
            );
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Enhanced time overlap checking with overnight class support
   */
  private timesOverlapWithOvernightSupport(
    timetable1: Timetable,
    timetable2: Timetable,
  ): boolean {
    // If neither class is overnight, use standard overlap check
    if (!timetable1.isOvernightClass && !timetable2.isOvernightClass) {
      return this.timesOverlap(
        timetable1.startTime,
        timetable1.endTime,
        timetable2.startTime,
        timetable2.endTime,
      );
    }

    // Handle overnight classes
    if (timetable1.isOvernightClass && !timetable2.isOvernightClass) {
      return this.overnightClassOverlapsRegular(timetable1, timetable2);
    }

    if (!timetable1.isOvernightClass && timetable2.isOvernightClass) {
      return this.overnightClassOverlapsRegular(timetable2, timetable1);
    }

    // Both classes are overnight
    if (timetable1.isOvernightClass && timetable2.isOvernightClass) {
      return this.bothOvernightClassesOverlap(timetable1, timetable2);
    }

    return false;
  }

  /**
   * Check if an overnight class overlaps with a regular class
   */
  private overnightClassOverlapsRegular(
    overnightClass: Timetable,
    regularClass: Timetable,
  ): boolean {
    const overnightStart = this.timeToMinutes(overnightClass.startTime);
    const overnightEnd = this.timeToMinutes(overnightClass.endTime);
    const regularStart = this.timeToMinutes(regularClass.startTime);
    const regularEnd = this.timeToMinutes(regularClass.endTime);

    // Overnight class goes from start time to midnight, then midnight to end time
    // Check if regular class overlaps with either part
    return (
      // Overlap with the evening part (start to midnight)
      (regularStart >= overnightStart || regularEnd > overnightStart) ||
      // Overlap with the morning part (midnight to end)
      (regularStart < overnightEnd || regularEnd <= overnightEnd)
    );
  }

  /**
   * Check if two overnight classes overlap
   */
  private bothOvernightClassesOverlap(
    class1: Timetable,
    class2: Timetable,
  ): boolean {
    // Convert times to minutes
    const start1 = this.timeToMinutes(class1.startTime);
    const end1 = this.timeToMinutes(class1.endTime);
    const start2 = this.timeToMinutes(class2.startTime);
    const end2 = this.timeToMinutes(class2.endTime);

    // For overnight classes, we need to check both the evening and morning portions
    // Evening portion: start time to 24:00 (1440 minutes)
    // Morning portion: 00:00 to end time

    // Check if evening portion of class1 overlaps with evening portion of class2
    const eveningOverlap = start1 < 1440 && start2 < 1440 && Math.max(start1, start2) < 1440;

    // Check if morning portion of class1 overlaps with morning portion of class2
    const morningOverlap = end1 > 0 && end2 > 0 && Math.min(end1, end2) > 0;

    // Check cross-portion overlaps (evening of one with morning of other)
    const crossOverlap1 = start1 < 1440 && end2 > 0;
    const crossOverlap2 = start2 < 1440 && end1 > 0;

    return eveningOverlap || morningOverlap || crossOverlap1 || crossOverlap2;
  }

  /**
   * Check for overnight conflicts between adjacent days
   */
  private checkOvernightConflicts(
    timetable1: Timetable,
    timetable2: Timetable,
  ): boolean {
    // Check if one day follows the other and there's an overnight class
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const day1Index = days.indexOf(timetable1.dayOfWeek);
    const day2Index = days.indexOf(timetable2.dayOfWeek);

    // Check if day2 is the next day after day1
    const isNextDay = (day1Index + 1) % 7 === day2Index;
    const isPrevDay = (day2Index + 1) % 7 === day1Index;

    if (isNextDay && timetable1.isOvernightClass) {
      // Class1 is overnight and extends into day2
      const class1End = this.timeToMinutes(timetable1.endTime);
      const class2Start = this.timeToMinutes(timetable2.startTime);
      return class1End > class2Start;
    }

    if (isPrevDay && timetable2.isOvernightClass) {
      // Class2 is overnight and extends into day1
      const class2End = this.timeToMinutes(timetable2.endTime);
      const class1Start = this.timeToMinutes(timetable1.startTime);
      return class2End > class1Start;
    }

    return false;
  }

  /**
   * Validate buffer time between consecutive classes
   */
  validateBufferTime(
    timetables: Timetable[],
    minBufferMinutes: number = 15,
  ): string[] {
    const violations: string[] = [];
    
    // Group timetables by day
    const timetablesByDay = timetables.reduce((acc, timetable) => {
      if (!acc[timetable.dayOfWeek]) {
        acc[timetable.dayOfWeek] = [];
      }
      acc[timetable.dayOfWeek].push(timetable);
      return acc;
    }, {} as Record<string, Timetable[]>);

    // Check buffer time for each day
    Object.entries(timetablesByDay).forEach(([day, dayTimetables]) => {
      if (dayTimetables.length > 1) {
        // Sort by start time
        const sortedTimetables = dayTimetables.sort((a, b) => 
          this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
        );

        for (let i = 0; i < sortedTimetables.length - 1; i++) {
          const current = sortedTimetables[i];
          const next = sortedTimetables[i + 1];

          if (!current.isOvernightClass) {
            const currentEnd = this.timeToMinutes(current.endTime);
            const nextStart = this.timeToMinutes(next.startTime);
            const bufferTime = nextStart - currentEnd;

            if (bufferTime < minBufferMinutes) {
              violations.push(
                `Insufficient buffer time on ${day}: only ${bufferTime} minutes between ${current.endTime} and ${next.startTime} (minimum: ${minBufferMinutes} minutes)`
              );
            }
          }
        }
      }
    });

    return violations;
  }

  /**
   * Validate daily study hours limit
   */
  validateDailyStudyHours(
    timetables: Timetable[],
    maxHoursPerDay: number = 8,
  ): string[] {
    const violations: string[] = [];

    // Group by day and calculate total hours
    const hoursByDay = timetables.reduce((acc, timetable) => {
      const day = timetable.dayOfWeek;
      if (!acc[day]) acc[day] = 0;

      let duration: number;
      if (timetable.isOvernightClass) {
        // For overnight classes, calculate duration across midnight
        const startMinutes = this.timeToMinutes(timetable.startTime);
        const endMinutes = this.timeToMinutes(timetable.endTime);
        duration = (1440 - startMinutes) + endMinutes; // 1440 = 24 * 60
      } else {
        const startMinutes = this.timeToMinutes(timetable.startTime);
        const endMinutes = this.timeToMinutes(timetable.endTime);
        duration = endMinutes - startMinutes;
      }

      acc[day] += duration / 60; // Convert to hours
      return acc;
    }, {} as Record<string, number>);

    // Check violations
    Object.entries(hoursByDay).forEach(([day, hours]) => {
      if (hours > maxHoursPerDay) {
        violations.push(
          `Daily study hours exceeded on ${day}: ${hours.toFixed(1)} hours (maximum: ${maxHoursPerDay} hours)`
        );
      }
    });

    return violations;
  }

  /**
   * Validate prerequisites for courses
   */
  async validatePrerequisites(
    studentId: number,
    courses: Course[],
  ): Promise<string[]> {
    const violations: string[] = [];

    // Get student's completed courses
    const completedEnrollments = await this.studentCourseSelectionRepository.find({
      where: { 
        studentId, 
        status: EnrollmentStatus.COMPLETED
      },
      relations: ['course']
    });
    
    const completedCourseIds = completedEnrollments.map(e => e.course.id);

    // Check prerequisites for each course
    for (const course of courses) {
      if (course.prerequisites) {
        const requiredCourseIds = course.prerequisites
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));

        const missingPrereqs = requiredCourseIds.filter(
          reqId => !completedCourseIds.includes(reqId)
        );

        if (missingPrereqs.length > 0) {
          violations.push(
            `Course ${course.code} requires completion of prerequisite courses: ${missingPrereqs.join(', ')}`
          );
        }
      }
    }

    return violations;
  }

  /**
   * Validate course capacity limits
   */
  async validateCourseCapacity(courseIds: number[]): Promise<string[]> {
    const violations: string[] = [];

    for (const courseId of courseIds) {
      const course = await this.courseRepository.findOne({
        where: { id: courseId }
      });

      if (course?.maxCapacity) {
        const currentEnrollmentCount = await this.studentCourseSelectionRepository.count({
          where: { 
            courseId,
            status: EnrollmentStatus.ENROLLED
          }
        });

        if (currentEnrollmentCount >= course.maxCapacity) {
          violations.push(
            `Course ${course.code} is at full capacity (${course.maxCapacity} students)`
          );
        }
      }
    }

    return violations;
  }

  /**
   * Validate credit hours limit per semester
   */
  validateCreditHoursLimit(
    courses: Course[],
    maxCreditHours: number = 18,
  ): string[] {
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

    if (totalCredits > maxCreditHours) {
      return [
        `Total credit hours (${totalCredits}) exceeds maximum allowed (${maxCreditHours})`
      ];
    }

    return [];
  }

  /**
   * Validate maximum courses per semester
   */
  validateMaxCoursesLimit(
    courseCount: number,
    maxCourses: number = 6,
  ): string[] {
    if (courseCount > maxCourses) {
      return [
        `Number of courses (${courseCount}) exceeds maximum allowed (${maxCourses})`
      ];
    }

    return [];
  }

  /**
   * Get enrollment configuration for a college
   */
  async getEnrollmentConfig(collegeId: number): Promise<EnrollmentConfig | null> {
    return await this.enrollmentConfigRepository.findOne({
      where: { collegeId }
    });
  }

  /**
   * Comprehensive validation combining all edge cases
   */
  async validateEnrollmentEdgeCases(
    studentId: number,
    courses: Course[],
    timetables: Timetable[],
    collegeId: number,
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];

    // Get enrollment configuration
    const config = await this.getEnrollmentConfig(collegeId);
    const maxCreditHours = config?.maxCreditHoursPerSemester || 18;
    const maxCoursesPerSemester = config?.maxCoursesPerSemester || 6;
    const maxStudyHoursPerDay = config?.maxStudyHoursPerDay || 8;
    const minBreakTime = config?.minBreakTimeBetweenClasses || 15;
    const allowOvernightClasses = config?.allowOvernightClasses || false;

    // 0. Check if overnight classes are allowed for this college
    const hasOvernightClasses = timetables.some(t => t.isOvernightClass);
    if (hasOvernightClasses && !allowOvernightClasses) {
      violations.push('Overnight classes are not allowed for this college');
    }

    // 1. Basic timetable conflicts (including overnight)
    violations.push(...this.findTimetableConflicts(timetables));

    // 2. Buffer time validation
    violations.push(...this.validateBufferTime(timetables, minBreakTime));

    // 3. Daily study hours validation
    violations.push(...this.validateDailyStudyHours(timetables, maxStudyHoursPerDay));

    // 4. Credit hours limit validation
    violations.push(...this.validateCreditHoursLimit(courses, maxCreditHours));

    // 5. Maximum courses limit validation
    violations.push(...this.validateMaxCoursesLimit(courses.length, maxCoursesPerSemester));

    // 6. Prerequisites validation
    const prereqViolations = await this.validatePrerequisites(studentId, courses);
    violations.push(...prereqViolations);

    // 7. Course capacity validation
    const capacityViolations = await this.validateCourseCapacity(courses.map(c => c.id));
    violations.push(...capacityViolations);

    return {
      valid: violations.length === 0,
      violations: violations.filter(v => v.length > 0) // Remove empty strings
    };
  }

  // Utility methods
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
}
