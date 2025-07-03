import { IsNotEmpty, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnenrollStudentDto {
  @ApiProperty({
    description: 'The ID of the student to unenroll',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({
    description: 'Array of course IDs to unenroll the student from',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  courseIds: number[];
}
