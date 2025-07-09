import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Course } from './course.entity';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

@Entity('timetables')
@Index(['courseId', 'dayOfWeek', 'startTime', 'endTime'], { unique: true })
export class Timetable {
  @ApiProperty({
    description: 'The unique identifier for the timetable entry',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The ID of the course',
    example: 1,
  })
  @Column({ name: 'courseId' })
  courseId: number;

  @ApiProperty({
    description: 'The day of the week for the class',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'The start time of the class',
    example: '09:00:00',
  })
  @Column({ type: 'time' })
  startTime: string;

  @ApiProperty({
    description: 'The end time of the class',
    example: '10:30:00',
  })
  @Column({ type: 'time' })
  endTime: string;

  @ApiProperty({
    description: 'Indicates if this class crosses midnight (overnight class)',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  isOvernightClass: boolean;

  @ApiProperty({
    description: 'The room where the class is held',
    example: 'Room 101',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  room: string;

  @ApiProperty({
    description: 'The timestamp when the timetable entry was created',
    type: 'string',
    format: 'date-time',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'The course associated with this timetable entry',
    type: () => Course,
  })
  @ManyToOne(() => Course, (course) => course.timetables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
