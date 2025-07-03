import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'student_enrollment',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Disabled - we manage schema manually with schema.sql
      logging: false, // Reduced logging for cleaner output
    }),
  ],
})
export class DatabaseModule {}
