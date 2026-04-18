import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { config } from '../config';

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 默认错误响应
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = '服务器内部错误';

  // 处理 ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  }
  // 处理 JWT 错误
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'TOKEN_INVALID';
    message = '无效的令牌';
  }
  // 处理 JWT 过期错误
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = '令牌已过期';
  }
  // 处理 Prisma 错误
  else if (err.name === 'PrismaClientKnownRequestError') {
    // @ts-expect-error Prisma error code
    const prismaErrorCode = err.code;

    if (prismaErrorCode === 'P2002') {
      statusCode = 409;
      errorCode = 'RESOURCE_CONFLICT';
      message = '资源已存在';
    } else if (prismaErrorCode === 'P2025') {
      statusCode = 404;
      errorCode = 'RESOURCE_NOT_FOUND';
      message = '资源不存在';
    }
  }
  // 处理验证错误
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  }

  // 开发环境返回详细错误信息
  const errorResponse: Record<string, unknown> = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
  };

  if (config.server.isDevelopment) {
    errorResponse.stack = err.stack;
    errorResponse.details = err.message;
  }

  // 记录错误日志
  console.error(`[Error] ${errorCode}: ${message}`);
  if (config.server.isDevelopment) {
    console.error(err.stack);
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 路由处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `路由 ${req.method} ${req.path} 不存在`,
    },
  });
}
