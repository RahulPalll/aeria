// Core data interfaces for the enrollment system

export interface College {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  student_id: string;
  name: string;
  college_id: number;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  college_id: number;
}

export interface Timetable {
  id: number;
  course_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface StudentCourseSelection {
  id: number;
  student_id: number;
  course_id: number;
}

export interface EnrollmentResult {
  success: boolean;
  message?: string;
  enrollments?: StudentCourseSelection[];
  error?: string;
}

export interface CourseWithTimetable extends Course {
  timetables: Timetable[];
}

export interface StudentEnrollment {
  course_id: number;
  code: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface CompletedCourse {
  id: number;
  student_id: number;
  course_id: number;
  completed_at: Date;
  code: string;
  name: string;
}

export interface TimetableConflict {
  conflictingCourse: Course;
  conflictingTimetable: Timetable;
  newTimetable: Timetable;
  overlapMinutes: number;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  conflicts?: TimetableConflict[];
  violations?: string[];
  error?: string;
}

export interface EnrollmentStats {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  completedCourses: number;
}

export interface CourseCapacity {
  course_id: number;
  max_capacity: number;
  current_enrollments: number;
  available_spots: number;
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}
