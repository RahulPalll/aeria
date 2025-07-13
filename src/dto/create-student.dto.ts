import { IsNotEmpty, IsString, IsNumber, MaxLength, MinLength, Matches, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({
    description: 'The unique student ID (3-15 alphanumeric characters)',
    example: 'MIT001',
    maxLength: 15,
    minLength: 3,
    pattern: '^[A-Z0-9]{3,15}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Student ID must be at least 3 characters long' })
  @MaxLength(15, { message: 'Student ID cannot exceed 15 characters' })
  @Matches(/^[A-Z0-9]{3,15}$/, {
    message: 'Student ID must contain only uppercase letters and numbers (3-15 characters)',
  })
  studentId: string;

  @ApiProperty({
    description: 'The name of the student (2-100 characters)',
    example: 'John Doe',
    maxLength: 100,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Student email address',
    example: 'john.doe@university.edu',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'The ID of the college the student belongs to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  collegeId: number;
}
