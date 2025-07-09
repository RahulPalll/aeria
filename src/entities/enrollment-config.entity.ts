import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { College } from './college.entity';

@Entity('enrollment_configs')
export class EnrollmentConfig {
  @ApiProperty({
    description: 'The unique identifier for the enrollment configuration',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The ID of the college this configuration applies to',
    example: 1,
  })
  @Column({ name: 'collegeId' })
  collegeId: number;

  @ApiProperty({
    description: 'Maximum credit hours a student can take per semester',
    example: 18,
  })
  @Column({ type: 'integer', default: 18 })
  maxCreditHoursPerSemester: number;

  @ApiProperty({
    description: 'Maximum study hours a student can have per day',
    example: 8,
  })
  @Column({ type: 'integer', default: 8 })
  maxStudyHoursPerDay: number;

  @ApiProperty({
    description: 'Minimum break time between classes in minutes',
    example: 15,
  })
  @Column({ type: 'integer', default: 15 })
  minBreakTimeBetweenClasses: number;

  @ApiProperty({
    description: 'Maximum number of courses a student can enroll in simultaneously',
    example: 6,
  })
  @Column({ type: 'integer', default: 6 })
  maxCoursesPerSemester: number;

  @ApiProperty({
    description: 'Whether overnight classes (crossing midnight) are allowed',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  allowOvernightClasses: boolean;

  @ApiProperty({
    description: 'The timestamp when the configuration was created',
    type: 'string',
    format: 'date-time',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'The college this configuration belongs to',
    type: () => College,
  })
  @ManyToOne(() => College, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collegeId' })
  college: College;
}
