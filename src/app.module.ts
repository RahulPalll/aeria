import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { EnrollmentModule } from './modules/enrollment.module';
import { AdminModule } from './modules/admin.module';

@Module({
  imports: [DatabaseModule, EnrollmentModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
