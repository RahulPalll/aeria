import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { College } from './college.entity';
import { Timetable } from './timetable.entity';
import { StudentCourseSelection } from './student-course-selection.entity';

@Entity('courses')
export class Course {
  @ApiProperty({
    description: 'The unique identifier for the course',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The course code',
    example: 'CS101',
  })
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @ApiProperty({
    description: 'The name of the course',
    example: 'Introduction to Computer Science',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'The description of the course',
    example: 'Basic programming concepts and algorithms',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'The number of credits for the course',
    example: 3,
  })
  @Column({ type: 'int', default: 3 })
  credits: number;

  @ApiProperty({
    description: 'Maximum number of students that can enroll in this course',
    example: 30,
  })
  @Column({ type: 'integer', nullable: true })
  maxCapacity: number;

  @ApiProperty({
    description: 'Prerequisites required for this course (comma-separated course IDs)',
    example: '1,2',
  })
  @Column({ type: 'text', nullable: true })
  prerequisites: string;

  @ApiProperty({
    description: 'The ID of the college the course belongs to',
    example: 1,
  })
  @Column({ name: 'collegeId' })
  collegeId: number;

  @ApiProperty({
    description: 'The timestamp when the course record was created',
    type: 'string',
    format: 'date-time',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'The college the course belongs to',
    type: () => College,
  })
  @ManyToOne(() => College, (college) => college.courses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collegeId' })
  college: College;

  @ApiProperty({
    description: 'The timetable entries for this course',
    type: 'array',
  })
  @OneToMany(() => Timetable, (timetable) => timetable.course)
  timetables: Timetable[];

  @ApiProperty({
    description: 'The student course selections for this course',
    type: 'array',
  })
  @OneToMany(() => StudentCourseSelection, (selection) => selection.course)
  selections: StudentCourseSelection[];
}
