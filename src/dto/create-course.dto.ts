import { IsNotEmpty, IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'The course code',
    example: 'CS101',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({
    description: 'The name of the course',
    example: 'Introduction to Computer Science',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'A description of the course',
    example: 'Basic programming concepts and algorithms',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'The number of credits for the course',
    example: 4,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  credits: number;

  @ApiProperty({
    description: 'The ID of the college offering the course',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  collegeId: number;
}
