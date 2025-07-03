import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Timetable } from '../entities/timetable.entity';
import { StudentCourseSelection } from '../entities/student-course-selection.entity';
import { College } from '../entities/college.entity';
import { Student } from '../entities/student.entity';
import { CreateTimetableDto } from '../dto/create-timetable.dto';
import { CreateCollegeDto } from '../dto/create-college.dto';
import { CreateStudentDto } from '../dto/create-student.dto';
import { CreateCourseDto } from '../dto/create-course.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Timetable)
    private timetableRepository: Repository<Timetable>,
    @InjectRepository(StudentCourseSelection)
    private studentCourseSelectionRepository: Repository<StudentCourseSelection>,
    @InjectRepository(College)
    private collegeRepository: Repository<College>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private dataSource: DataSource,
  ) {}

  async createTimetable(timetableData: CreateTimetableDto): Promise<Timetable> {
    try {
      const { courseId, dayOfWeek, startTime, endTime, room } = timetableData;

      // Validate that end time is after start time
      if (this.timeToMinutes(endTime) <= this.timeToMinutes(startTime)) {
        throw new BadRequestException('End time must be after start time');
      }

      // Verify course exists
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['college'],
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      // Check for existing timetable conflicts for the same course
      const existingTimetables = await this.timetableRepository.find({
        where: { courseId, dayOfWeek },
      });

      for (const existing of existingTimetables) {
        if (
          this.timesOverlap(
            startTime,
            endTime,
            existing.startTime,
            existing.endTime,
          )
        ) {
          throw new ConflictException(
            `Timetable conflicts with existing schedule: ${existing.dayOfWeek} ${existing.startTime}-${existing.endTime}`,
          );
        }
      }

      // Create new timetable
      const timetable = this.timetableRepository.create({
        courseId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      });

      return await this.timetableRepository.save(timetable);
    } catch (error) {
      console.error('Error creating timetable:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create timetable: ' + error.message,
      );
    }
  }

  async updateTimetable(
    timetableId: number,
    updateData: Partial<CreateTimetableDto>,
  ): Promise<Timetable> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        try {
          const timetable = await manager.findOne(Timetable, {
            where: { id: timetableId },
            relations: ['course'],
          });

          if (!timetable) {
            throw new NotFoundException(
              `Timetable with ID ${timetableId} not found`,
            );
          }

          // Check if there are students enrolled in this course
          const enrolledStudents = await manager.count(StudentCourseSelection, {
            where: { courseId: timetable.courseId },
          });

          if (enrolledStudents > 0) {
            // If students are enrolled, we need to check for conflicts with their other courses
            const updatedTimetable = { ...timetable, ...updateData };

            if (updateData.startTime && updateData.endTime) {
              if (
                this.timeToMinutes(updateData.endTime) <=
                this.timeToMinutes(updateData.startTime)
              ) {
                throw new BadRequestException(
                  'End time must be after start time',
                );
              }
            }

            // Get all students enrolled in this course
            const enrollments = await manager.find(StudentCourseSelection, {
              where: { courseId: timetable.courseId },
              relations: ['student'],
            });

            // Check for conflicts with each student's other courses
            for (const enrollment of enrollments) {
              const studentOtherCourses = await manager
                .createQueryBuilder(StudentCourseSelection, 'scs')
                .leftJoinAndSelect('scs.course', 'course')
                .leftJoinAndSelect('course.timetables', 'timetables')
                .where('scs.studentId = :studentId', {
                  studentId: enrollment.studentId,
                })
                .andWhere('scs.courseId != :courseId', {
                  courseId: timetable.courseId,
                })
                .getMany();

              // Check for conflicts
              for (const otherEnrollment of studentOtherCourses) {
                for (const otherTimetable of otherEnrollment.course
                  .timetables) {
                  if (
                    otherTimetable.dayOfWeek ===
                    (updateData.dayOfWeek || timetable.dayOfWeek)
                  ) {
                    const newStartTime =
                      updateData.startTime || timetable.startTime;
                    const newEndTime = updateData.endTime || timetable.endTime;

                    if (
                      this.timesOverlap(
                        newStartTime,
                        newEndTime,
                        otherTimetable.startTime,
                        otherTimetable.endTime,
                      )
                    ) {
                      throw new ConflictException(
                        `Cannot update timetable: would create conflict for student ${enrollment.student.name} with course ${otherEnrollment.course.code}`,
                      );
                    }
                  }
                }
              }
            }
          }

          // Update timetable
          Object.assign(timetable, updateData);
          return await manager.save(Timetable, timetable);
        } catch (error) {
          // Handle specific errors in the transaction
          if (
            error instanceof BadRequestException ||
            error instanceof NotFoundException ||
            error instanceof ConflictException
          ) {
            throw error;
          }
          // Log and rethrow unexpected errors
          console.error('Error in update timetable transaction:', error);
          throw new BadRequestException(
            'Failed to update timetable: ' + error.message,
          );
        }
      });
    } catch (error) {
      // Handle outer errors (outside the transaction)
      console.error('Update timetable error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Update timetable failed: ' + error.message,
      );
    }
  }

  async deleteTimetable(timetableId: number): Promise<{ message: string }> {
    try {
      const timetable = await this.timetableRepository.findOne({
        where: { id: timetableId },
      });

      if (!timetable) {
        throw new NotFoundException(
          `Timetable with ID ${timetableId} not found`,
        );
      }

      // Check if there are students enrolled in this course
      const enrolledStudents =
        await this.studentCourseSelectionRepository.count({
          where: { courseId: timetable.courseId },
        });

      if (enrolledStudents > 0) {
        throw new ConflictException(
          'Cannot delete timetable: students are currently enrolled in this course',
        );
      }

      await this.timetableRepository.remove(timetable);
      return { message: 'Timetable deleted successfully' };
    } catch (error) {
      console.error('Error deleting timetable:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to delete timetable: ' + error.message,
      );
    }
  }

  async getCourseTimetables(courseId: number): Promise<Timetable[]> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      return await this.timetableRepository.find({
        where: { courseId },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
      });
    } catch (error) {
      console.error('Error getting course timetables:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to retrieve course timetables: ' + error.message,
      );
    }
  }

  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const startTime1 = this.timeToMinutes(start1);
    const endTime1 = this.timeToMinutes(end1);
    const startTime2 = this.timeToMinutes(start2);
    const endTime2 = this.timeToMinutes(end2);

    return startTime1 < endTime2 && endTime1 > startTime2;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // College Management
  async createCollege(collegeData: CreateCollegeDto): Promise<College> {
    try {
      const college = this.collegeRepository.create(collegeData);
      return await this.collegeRepository.save(college);
    } catch (error) {
      console.error('Error creating college:', error);
      throw new BadRequestException('Failed to create college: ' + error.message);
    }
  }

  async getAllColleges(): Promise<College[]> {
    try {
      return await this.collegeRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
      console.error('Error getting colleges:', error);
      throw new BadRequestException('Failed to retrieve colleges: ' + error.message);
    }
  }

  async updateCollege(id: number, collegeData: CreateCollegeDto): Promise<College> {
    try {
      const college = await this.collegeRepository.findOne({ where: { id } });
      if (!college) {
        throw new NotFoundException(`College with ID ${id} not found`);
      }

      Object.assign(college, collegeData);
      return await this.collegeRepository.save(college);
    } catch (error) {
      console.error('Error updating college:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update college: ' + error.message);
    }
  }

  async deleteCollege(id: number): Promise<{ message: string }> {
    try {
      const college = await this.collegeRepository.findOne({ where: { id } });
      if (!college) {
        throw new NotFoundException(`College with ID ${id} not found`);
      }

      // Check if any students or courses are associated
      const studentCount = await this.studentRepository.count({ where: { collegeId: id } });
      const courseCount = await this.courseRepository.count({ where: { collegeId: id } });

      if (studentCount > 0 || courseCount > 0) {
        throw new ConflictException(
          `Cannot delete college: ${studentCount} students and ${courseCount} courses are associated`,
        );
      }

      await this.collegeRepository.remove(college);
      return { message: `College "${college.name}" deleted successfully` };
    } catch (error) {
      console.error('Error deleting college:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete college: ' + error.message);
    }
  }

  // Student Management
  async createStudent(studentData: CreateStudentDto): Promise<Student> {
    try {
      // Verify college exists
      const college = await this.collegeRepository.findOne({
        where: { id: studentData.collegeId },
      });
      if (!college) {
        throw new NotFoundException(`College with ID ${studentData.collegeId} not found`);
      }

      const student = this.studentRepository.create(studentData);
      return await this.studentRepository.save(student);
    } catch (error) {
      console.error('Error creating student:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create student: ' + error.message);
    }
  }

  async getStudent(id: number): Promise<Student> {
    try {
      const student = await this.studentRepository.findOne({
        where: { id },
        relations: ['college'],
      });
      
      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      return student;
    } catch (error) {
      console.error('Error getting student:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve student: ' + error.message);
    }
  }

  async updateStudent(id: number, studentData: CreateStudentDto): Promise<Student> {
    try {
      const student = await this.studentRepository.findOne({ where: { id } });
      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      // Verify college exists if collegeId is being updated
      if (studentData.collegeId !== student.collegeId) {
        const college = await this.collegeRepository.findOne({
          where: { id: studentData.collegeId },
        });
        if (!college) {
          throw new NotFoundException(`College with ID ${studentData.collegeId} not found`);
        }
      }

      Object.assign(student, studentData);
      return await this.studentRepository.save(student);
    } catch (error) {
      console.error('Error updating student:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update student: ' + error.message);
    }
  }

  async deleteStudent(id: number): Promise<{ message: string }> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const student = await manager.findOne(Student, { where: { id } });
        if (!student) {
          throw new NotFoundException(`Student with ID ${id} not found`);
        }

        // Remove all enrollments first
        await manager.delete(StudentCourseSelection, { studentId: id });
        
        // Remove student
        await manager.remove(student);
        
        return { message: `Student "${student.name}" deleted successfully` };
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete student: ' + error.message);
    }
  }

  // Course Management
  async createCourse(courseData: CreateCourseDto): Promise<Course> {
    try {
      // Verify college exists
      const college = await this.collegeRepository.findOne({
        where: { id: courseData.collegeId },
      });
      if (!college) {
        throw new NotFoundException(`College with ID ${courseData.collegeId} not found`);
      }

      const course = this.courseRepository.create(courseData);
      return await this.courseRepository.save(course);
    } catch (error) {
      console.error('Error creating course:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create course: ' + error.message);
    }
  }

  async getCourse(id: number): Promise<Course> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['college'],
      });
      
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      return course;
    } catch (error) {
      console.error('Error getting course:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve course: ' + error.message);
    }
  }

  async updateCourse(id: number, courseData: CreateCourseDto): Promise<Course> {
    try {
      const course = await this.courseRepository.findOne({ where: { id } });
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      // Verify college exists if collegeId is being updated
      if (courseData.collegeId !== course.collegeId) {
        const college = await this.collegeRepository.findOne({
          where: { id: courseData.collegeId },
        });
        if (!college) {
          throw new NotFoundException(`College with ID ${courseData.collegeId} not found`);
        }
      }

      Object.assign(course, courseData);
      return await this.courseRepository.save(course);
    } catch (error) {
      console.error('Error updating course:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update course: ' + error.message);
    }
  }

  async deleteCourse(id: number): Promise<{ message: string }> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const course = await manager.findOne(Course, { where: { id } });
        if (!course) {
          throw new NotFoundException(`Course with ID ${id} not found`);
        }

        // Check if any enrollments exist
        const enrollmentCount = await manager.count(StudentCourseSelection, {
          where: { courseId: id },
        });

        if (enrollmentCount > 0) {
          throw new ConflictException(
            `Cannot delete course: ${enrollmentCount} students are enrolled`,
          );
        }

        // Remove all timetables first
        await manager.delete(Timetable, { courseId: id });
        
        // Remove course
        await manager.remove(course);
        
        return { message: `Course "${course.name}" deleted successfully` };
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete course: ' + error.message);
    }
  }

  async validateTimetable(
    timetableData: CreateTimetableDto,
  ): Promise<{ valid: boolean; message: string; conflicts: string[] }> {
    const { courseId, dayOfWeek, startTime, endTime } = timetableData;
    const conflicts: string[] = [];

    try {
      // Validate that end time is after start time
      if (this.timeToMinutes(endTime) <= this.timeToMinutes(startTime)) {
        conflicts.push('End time must be after start time');
      }

      // Verify course exists
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!course) {
        conflicts.push(`Course with ID ${courseId} not found`);
      }

      // Check for existing timetable conflicts for the same course
      const existingTimetables = await this.timetableRepository.find({
        where: { courseId, dayOfWeek },
      });

      for (const existing of existingTimetables) {
        if (this.timesOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
          conflicts.push(
            `Time conflict: ${dayOfWeek} ${startTime}-${endTime} overlaps with existing ${existing.startTime}-${existing.endTime}`,
          );
        }
      }

      const isValid = conflicts.length === 0;
      return {
        valid: isValid,
        message: isValid ? 'Timetable validation successful' : 'Timetable validation failed',
        conflicts,
      };
    } catch (error) {
      console.error('Error validating timetable:', error);
      return {
        valid: false,
        message: 'Validation failed due to system error',
        conflicts: ['System error during validation'],
      };
    }
  }
}
