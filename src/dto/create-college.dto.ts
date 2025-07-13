import { IsNotEmpty, IsString, MaxLength, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollegeDto {
  @ApiProperty({
    description: 'The name of the college (3-100 characters)',
    example: 'Massachusetts Institute of Technology',
    maxLength: 100,
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'College name must be at least 3 characters long' })
  @MaxLength(100, { message: 'College name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'College code (2-5 uppercase letters)',
    example: 'MIT',
    required: false,
    pattern: '^[A-Z]{2,5}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2,5}$/, {
    message: 'College code must be 2-5 uppercase letters only',
  })
  code?: string;

  @ApiProperty({
    description: 'College address (minimum 10 characters)',
    example: '77 Massachusetts Avenue, Cambridge, MA 02139',
    required: false,
    minLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Address must be at least 10 characters long' })
  address?: string;
}
