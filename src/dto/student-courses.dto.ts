import { IsArray, IsNotEmpty, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base DTO for operations involving a student and multiple courses
 * Used for enrollment, validation, and unenrollment operations
 */
export class StudentCoursesDto {
  @ApiProperty({
    description: 'The ID of the student',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({
    description: 'Array of course IDs',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  courseIds: number[];
}

/**
 * DTO for enrollment operations - extends base with specific validation
 */
export class EnrollStudentDto extends StudentCoursesDto {}

/**
 * DTO for validation operations - same as base
 */
export class ValidateEnrollmentDto extends StudentCoursesDto {}

/**
 * DTO for unenrollment operations - same as base
 */
export class UnenrollStudentDto extends StudentCoursesDto {}
