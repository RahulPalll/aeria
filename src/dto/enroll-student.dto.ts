import { IsArray, IsNotEmpty, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollStudentDto {
  @ApiProperty({
    description: 'The ID of the student to enroll',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({
    description: 'Array of course IDs to enroll the student in',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one course must be selected' })
  @IsNumber({}, { each: true })
  courseIds: number[];
}
