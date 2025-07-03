import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentModule } from './enrollment.module';
import { AdminController } from '../controllers/admin.controller';
import { ValidationController } from '../controllers/validation.controller';
import { AdminService } from '../services/admin.service';
import { Course } from '../entities/course.entity';
import { Timetable } from '../entities/timetable.entity';
import { StudentCourseSelection } from '../entities/student-course-selection.entity';
import { College } from '../entities/college.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course, 
      Timetable, 
      StudentCourseSelection, 
      College, 
      Student
    ]),
    EnrollmentModule,
  ],
  controllers: [AdminController, ValidationController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
