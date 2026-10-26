import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";
import { randomUUID } from "node:crypto";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers["x-correlation-id"] as string) ||
      (request.headers["correlation-id"] as string) ||
      `corr-${randomUUID()}`;

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
      const isDevOrTest =
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test";

      if (status === HttpStatus.INTERNAL_SERVER_ERROR && !isDevOrTest) {
        message = "An unexpected internal server error occurred";
      } else {
        message = exception.message;
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${correlationId}] Internal Exception on ${request.method} ${request.url}: ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined
      );
    }

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
