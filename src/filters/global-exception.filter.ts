import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

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
    } else if (exception instanceof QueryFailedError) {
      // For TypeORM query errors
      status = HttpStatus.BAD_REQUEST;
      const queryError = exception as unknown as { detail?: string };
      message = queryError.detail
        ? String(queryError.detail)
        : 'Database query failed';
      error = 'Database Error';
    } else if (exception instanceof EntityNotFoundError) {
      // For TypeORM entity not found errors
      status = HttpStatus.NOT_FOUND;
      message = exception.message || 'Entity not found';
      error = 'Not Found';
    } else if (exception instanceof Error) {
      // For other JavaScript errors
      message = exception.message || message;
      error = exception.name || error;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
