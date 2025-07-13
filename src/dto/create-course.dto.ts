import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Course code (format: 2 letters + 3 digits, e.g., CS101)',
    example: 'CS101',
    pattern: '^[A-Z]{2}[0-9]{3}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}[0-9]{3}$/, {
    message: 'Course code must be in format: 2 uppercase letters followed by 3 digits (e.g., CS101)',
  })
  code: string;

  @ApiProperty({
    description: 'Course name (3-255 characters)',
    example: 'Introduction to Computer Science',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'Course name must be a string' })
  @IsNotEmpty({ message: 'Course name is required' })
  @Length(3, 255, { message: 'Course name must be between 3 and 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Number of credits for this course (1-6)',
    example: 3,
    minimum: 1,
    maximum: 6,
  })
  @IsNumber()
  @Min(1, { message: 'Credits must be at least 1' })
  @Max(6, { message: 'Credits cannot exceed 6' })
  credits: number;

  @ApiProperty({
    description: 'ID of the college this course belongs to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  collegeId: number;

  @ApiProperty({
    description: 'Maximum capacity for this course (1-200)',
    example: 30,
    minimum: 1,
    maximum: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Maximum capacity must be at least 1' })
  @Max(200, { message: 'Maximum capacity cannot exceed 200' })
  maxCapacity?: number;

  @ApiProperty({
    description: 'Course description (optional, max 1000 characters)',
    example: 'An introduction to fundamental concepts in computer science',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Course description must be a string' })
  @Length(1, 1000, { message: 'Course description cannot exceed 1000 characters' })
  description?: string;
}
