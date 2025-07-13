import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Log the exception for debugging
    this.logger.error(
      `Exception occurred: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : '',
    );

    if (exception instanceof HttpException) {
      // For NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message =
          typeof (exceptionResponse as Record<string, unknown>).message ===
          'string'
            ? String((exceptionResponse as Record<string, unknown>).message)
            : message;
        error =
          typeof (exceptionResponse as Record<string, unknown>).error ===
          'string'
            ? String((exceptionResponse as Record<string, unknown>).error)
            : exception.name;
      } else {
        message = String(exceptionResponse);
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      // For PostgreSQL/Database errors
      const dbError = exception as any;
      if (dbError.code) {
        switch (dbError.code) {
          case '23505': // Unique violation
            status = HttpStatus.CONFLICT;
            message = 'Duplicate entry';
            error = 'Conflict';
            break;
          case '23503': // Foreign key violation
            status = HttpStatus.BAD_REQUEST;
            message = 'Referenced record not found';
            error = 'Foreign Key Violation';
            break;
          case '23514': // Check constraint violation
            status = HttpStatus.BAD_REQUEST;
            message = 'Data validation failed';
            error = 'Constraint Violation';
            break;
          default:
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Database error occurred';
            error = 'Database Error';
        }
      } else {
        // For other JavaScript errors
        message = exception.message || message;
        error = exception.name || error;
      }
    }

    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : 'No stack trace available'
    );

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
