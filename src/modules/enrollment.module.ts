import { Module } from '@nestjs/common';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { CoursesController } from '../controllers/courses.controller';
import { ValidationController } from '../controllers/validation.controller';
import { EnrollmentService } from '../services/enrollment.service';
import { ValidationService } from '../services/validation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EnrollmentController, CoursesController, ValidationController],
  providers: [EnrollmentService, ValidationService],
  exports: [EnrollmentService, ValidationService],
})
export class EnrollmentModule {}
