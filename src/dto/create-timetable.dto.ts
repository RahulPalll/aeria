import {  
  IsIn,  
  IsNotEmpty,  
  IsNumber,  
  IsString,  
  Matches,
  IsOptional,
  ValidateBy,
  ValidationOptions,
  buildMessage,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Custom validator for time range validation
@ValidatorConstraint({ name: 'isValidTimeRange', async: false })
export class IsValidTimeRangeConstraint implements ValidatorConstraintInterface {
  validate(endTime: string, args: any) {
    const object = args.object as CreateTimetableDto;
    
    if (!object.startTime || !endTime) {
      return false;
    }
    
    // Convert time strings to minutes for comparison
    const startMinutes = this.timeToMinutes(object.startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    // Check if end time is after start time
    if (endMinutes <= startMinutes) {
      return false;
    }
    
    // Check minimum duration (30 minutes)
    if (endMinutes - startMinutes < 30) {
      return false;
    }
    
    // Check maximum duration (4 hours = 240 minutes)
    if (endMinutes - startMinutes > 240) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: any) {
    const object = args.object as CreateTimetableDto;
    
    if (!object.startTime || !args.value) {
      return 'Both start time and end time must be provided';
    }
    
    const startMinutes = this.timeToMinutes(object.startTime);
    const endMinutes = this.timeToMinutes(args.value);
    const duration = endMinutes - startMinutes;
    
    if (endMinutes <= startMinutes) {
      return 'End time must be after start time';
    }
    
    if (duration < 30) {
      return 'Class duration must be at least 30 minutes';
    }
    
    if (duration > 240) {
      return 'Class duration cannot exceed 4 hours';
    }
    
    return 'Invalid time range';
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Custom validator for valid time range
export function IsValidTimeRange(validationOptions?: ValidationOptions) {
  return Validate(IsValidTimeRangeConstraint, validationOptions);
}

export class CreateTimetableDto {  
  @ApiProperty({    
    description: 'The ID of the course this timetable belongs to',    
    example: 1,    
    type: 'number',  
  })  
  @IsNumber({}, { message: 'Course ID must be a valid number' })  
  @IsNotEmpty({ message: 'Course ID is required' })  
  courseId: number;  

  @ApiProperty({    
    description: 'Day of the week for the class',    
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],    
    example: 'MONDAY',  
  })  
  @IsIn(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], {
    message: 'Day of week must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY'
  })  
  @IsNotEmpty({ message: 'Day of week is required' })  
  dayOfWeek: string;  

  @ApiProperty({    
    description: 'Start time in HH:MM format (24-hour, between 06:00-23:00)',    
    example: '09:00',    
    pattern: '^(0[6-9]|1[0-9]|2[0-3]):[0-5][0-9]$',  
  })  
  @IsString({ message: 'Start time must be a string' })  
  @IsNotEmpty({ message: 'Start time is required' })  
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {    
    message: 'Start time must be in HH:MM format (24-hour)',  
  })
  @Matches(/^(0[6-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be between 06:00 and 23:00',
  })
  startTime: string;  

  @ApiProperty({    
    description: 'End time in HH:MM format (24-hour, between 06:30-23:59)',    
    example: '10:30',    
    pattern: '^(0[6-9]|1[0-9]|2[0-3]):[0-5][0-9]$|^23:59$',  
  })  
  @IsString({ message: 'End time must be a string' })  
  @IsNotEmpty({ message: 'End time is required' })  
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {    
    message: 'End time must be in HH:MM format (24-hour)',  
  })
  @Matches(/^(0[6-9]|1[0-9]|2[0-3]):[0-5][0-9]$|^23:59$/, {
    message: 'End time must be between 06:30 and 23:59',
  })
  @IsValidTimeRange({
    message: 'Invalid time range - check start/end times and duration constraints',
  })
  endTime: string;

  @ApiProperty({    
    description: 'Whether this is an overnight class (crosses midnight)',    
    example: false,
    required: false,  
  })  
  @IsOptional()
  @IsBoolean({ message: 'isOvernightClass must be a boolean' })
  isOvernightClass?: boolean;
}