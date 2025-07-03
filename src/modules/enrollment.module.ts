import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { CoursesController } from '../controllers/courses.controller';
import { EnrollmentService } from '../services/enrollment.service';
import { Student } from '../entities/student.entity';
import { Course } from '../entities/course.entity';
import { Timetable } from '../entities/timetable.entity';
import { StudentCourseSelection } from '../entities/student-course-selection.entity';
import { College } from '../entities/college.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Course,
      Timetable,
      StudentCourseSelection,
      College,
    ]),
  ],
  controllers: [EnrollmentController, CoursesController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
