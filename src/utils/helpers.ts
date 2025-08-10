import { ApiResponse, ValidationError } from '@/types/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: ValidationError[];

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errors?: ValidationError[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (errors) {
      this.errors = errors;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createResponse = <T = any>(
  success: boolean,
  message: string,
  data?: T,
  errors?: string[],
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (errors) {
    response.errors = errors;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
};

export const createSuccessResponse = <T = any>(
  message: string,
  data?: T,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): ApiResponse<T> => {
  return createResponse(true, message, data, undefined, pagination);
};

export const createErrorResponse = (message: string, errors?: string[]): ApiResponse => {
  return createResponse(false, message, undefined, errors);
};

export const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any>) => {
  return (req: any, res: any, next: any): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateVerificationToken = (): string => {
  return generateRandomString(64);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  // Username should be 3-30 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

export const isValidPassword = (password: string): boolean => {
  // Password should be at least 8 characters
  return password.length >= 8;
};

export const sanitizeUser = (user: any): any => {
  const { password, verify_token, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const calculatePagination = (
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  offset: number;
} => {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    totalPages,
    offset,
  };
};
