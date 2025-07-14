import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);

    // Apply global exception filter for centralized error handling
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Enable global validation pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Enable CORS
    app.enableCors();

    // Swagger Documentation Configuration
    const config = new DocumentBuilder()
      .setTitle('Student Course Enrollment System')
      .setDescription(
        'A comprehensive backend system for managing student course enrollment with timetable conflict detection and validation.',
      )
      .setVersion('1.0')
      .addTag('enrollment', 'Student course enrollment operations')
      .addTag('admin', 'Administrative operations for timetable management')
      .addServer('http://localhost:3001', 'Development server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      customSiteTitle: 'Student Enrollment API',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    // Get configured port from environment or use default
    const configService = app.get(ConfigService);
    const port = configService.get('PORT') || 3000;

    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(
      `Swagger documentation available at: http://localhost:${port}/api`,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error(
      `Error during application bootstrap: ${errorMessage}`,
      errorStack,
    );
    process.exit(1);
  }
}

// Execute bootstrap with proper error handling
bootstrap().catch((err) => {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  console.error('Failed to start application:', errorMessage);
  process.exit(1);
});
