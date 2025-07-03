import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollegeDto {
  @ApiProperty({
    description: 'The name of the college',
    example: 'College of Engineering',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'A brief description of the college',
    example: 'College focused on engineering and technology programs',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  description?: string;
}
