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
import { StudentCourseSelection } from './student-course-selection.entity';

@Entity('students')
export class Student {
  @ApiProperty({
    description: 'The unique identifier for the student',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The full name of the student',
    example: 'John Doe',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'The email address of the student',
    example: 'john.doe@university.edu',
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @ApiProperty({
    description: 'The unique student ID assigned by the college',
    example: 'ST12345',
  })
  @Column({ type: 'varchar', length: 20, unique: true })
  studentId: string;

  @ApiProperty({
    description: 'The ID of the college the student belongs to',
    example: 1,
  })
  @Column({ name: 'collegeId' })
  collegeId: number;

  @ApiProperty({
    description: 'The timestamp when the student record was created',
    type: 'string',
    format: 'date-time',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'The college the student belongs to',
    type: () => College,
  })
  @ManyToOne(() => College, (college) => college.students, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collegeId' })
  college: College;

  @ApiProperty({
    description: 'The courses the student has enrolled in',
    type: 'array',
  })
  @OneToMany(() => StudentCourseSelection, (selection) => selection.student)
  courseSelections: StudentCourseSelection[];
}
