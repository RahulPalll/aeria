import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Student } from './student.entity';
import { Course } from './course.entity';

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  WITHDRAWN = 'WITHDRAWN',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('student_course_selections')
@Index(['studentId', 'courseId'], { unique: true })
export class StudentCourseSelection {
  @ApiProperty({
    description: 'The unique identifier for the enrollment record',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The ID of the student who is enrolled',
    example: 1,
  })
  @Column({ name: 'studentId' })
  studentId: number;

  @ApiProperty({
    description: 'The ID of the course the student is enrolled in',
    example: 1,
  })
  @Column({ name: 'courseId' })
  courseId: number;

  @ApiProperty({
    description: 'The timestamp when the student enrolled in the course',
    type: 'string',
    format: 'date-time',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt: Date;

  @ApiProperty({
    description: 'The current status of the enrollment',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.ENROLLED,
  })
  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ENROLLED,
  })
  status: EnrollmentStatus;

  @ApiProperty({
    description: 'The grade earned by the student in the course',
    example: 'A',
    required: false,
  })
  @Column({ nullable: true, length: 5 })
  grade: string;

  @ApiProperty({
    description: 'The student enrolled in the course',
    type: () => Student,
  })
  @ManyToOne(() => Student, (student) => student.courseSelections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @ApiProperty({
    description: 'The course the student is enrolled in',
    type: () => Course,
  })
  @ManyToOne(() => Course, (course) => course.selections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
