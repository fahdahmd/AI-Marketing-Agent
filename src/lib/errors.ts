export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "You must be signed in to do that.") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(entity = "Resource") {
    super(`${entity} not found.`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "The provided data is invalid.",
    public readonly issues?: unknown
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class UsageLimitError extends AppError {
  constructor(message: string) {
    super(message, 402, "USAGE_LIMIT_REACHED");
  }
}

export class ConflictError extends AppError {
  constructor(message = "This action conflicts with existing data.") {
    super(message, 409, "CONFLICT");
  }
}
