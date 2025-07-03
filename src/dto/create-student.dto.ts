import { IsNotEmpty, IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({
    description: 'The name of the student',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'The email address of the student',
    example: 'john.doe@email.com',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'The ID of the college the student belongs to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  collegeId: number;

  @ApiProperty({
    description: 'The major/field of study for the student',
    example: 'Computer Science',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  major?: string;
}
