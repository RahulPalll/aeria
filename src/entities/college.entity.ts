import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Student } from './student.entity';
import { Course } from './course.entity';

@Entity('colleges')
export class College {
  @ApiProperty({
    description: 'The unique identifier for the college',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The full name of the college',
    example: 'Massachusetts Institute of Technology',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @ApiProperty({
    description: 'A short code or abbreviation for the college',
    example: 'MIT',
  })
  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @ApiProperty({
    description: 'The physical address of the college',
    example: '77 Massachusetts Ave, Cambridge, MA 02139',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({
    description: 'The timestamp when the college record was created',
    type: 'string',
    format: 'date-time',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Student, (student) => student.college)
  students: Student[];

  @OneToMany(() => Course, (course) => course.college)
  courses: Course[];
}
