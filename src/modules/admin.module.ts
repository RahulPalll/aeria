import { Module } from '@nestjs/common';
import { EnrollmentModule } from './enrollment.module';
import { AdminController } from '../controllers/admin.controller';
import { ValidationController } from '../controllers/validation.controller';
import { AdminService } from '../services/admin.service';

@Module({
  imports: [EnrollmentModule],
  controllers: [AdminController, ValidationController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
