import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response, Request } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let code = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred";
    let details: unknown = undefined;

    if (typeof exceptionResponse === "string") {
      message = exceptionResponse;
      code = HttpStatus[status] || "ERROR";
    } else if (
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null
    ) {
      const resp = exceptionResponse as Record<string, any>;
      code = resp.error || HttpStatus[status] || "ERROR";
      message = resp.message || message;
      details =
        resp.details ||
        (Array.isArray(resp.message) ? resp.message : undefined);
    } else if (exception instanceof Error) {
      // In production mode, sanitize unhandled 500 exceptions to prevent internal SQL/driver disclosure
      if (
        status === HttpStatus.INTERNAL_SERVER_ERROR &&
        process.env.NODE_ENV === "production"
      ) {
        message = "An unexpected internal server error occurred";
      } else {
        message = exception.message;
      }
    }

    const correlationId =
      (request.headers["x-correlation-id"] as string) ||
      (request.headers["correlation-id"] as string) ||
      `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    response.status(status).json({
      error: {
        code,
        message,
        correlationId,
        details,
      },
    });
  }
}
