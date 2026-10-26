import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      headers: {},
      method: "GET",
      url: "/api/test",
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it("should handle standard HttpException correctly", () => {
    const exception = new HttpException("Bad Request", HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: "BAD_REQUEST",
        message: "Bad Request",
        correlationId: expect.any(String),
        details: undefined,
      },
    });
  });

  it("should preserve provided x-correlation-id header", () => {
    mockRequest.headers["x-correlation-id"] = "custom-correlation-123";
    const exception = new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: expect.objectContaining({
        correlationId: "custom-correlation-123",
      }),
    });
  });

  it("should generate cryptographically valid UUID when correlation header is missing", () => {
    const exception = new HttpException("Forbidden", HttpStatus.FORBIDDEN);

    filter.catch(exception, mockArgumentsHost);

    const jsonArg = mockResponse.json.mock.calls[0][0];
    const uuidRegex =
      /^(corr-)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(jsonArg.error.correlationId).toMatch(uuidRegex);
  });

  it("should sanitize unhandled 500 error messages in staging/production environments", () => {
    process.env.NODE_ENV = "staging";
    const internalError = new Error("SELECT * FROM secret_table FAILED: db connection timeout");

    filter.catch(internalError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected internal server error occurred",
        correlationId: expect.any(String),
        details: undefined,
      },
    });
  });

  it("should reveal detailed error message only in development mode", () => {
    process.env.NODE_ENV = "development";
    const internalError = new Error("Database connection error detail");

    filter.catch(internalError, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: "Database connection error detail",
      }),
    });
  });
});
