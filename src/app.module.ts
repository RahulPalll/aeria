import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthService } from './services/health.service';
import { DatabaseModule } from './database/database.module';
import { EnrollmentModule } from './modules/enrollment.module';
import { AdminModule } from './modules/admin.module';

@Module({
  imports: [DatabaseModule, EnrollmentModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, HealthService],
})
export class AppModule {}
