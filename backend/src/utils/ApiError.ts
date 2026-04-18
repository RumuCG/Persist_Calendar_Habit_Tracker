/**
 * API 错误类
 * 用于统一错误处理
 */
export class ApiError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ApiError';

    // 保持正确的堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 401 未授权错误
   */
  static unauthorized(message: string = '未授权访问'): ApiError {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  /**
   * 403 禁止访问错误
   */
  static forbidden(message: string = '禁止访问'): ApiError {
    return new ApiError('FORBIDDEN', message, 403);
  }

  /**
   * 404 资源不存在错误
   */
  static notFound(message: string = '资源不存在'): ApiError {
    return new ApiError('RESOURCE_NOT_FOUND', message, 404);
  }

  /**
   * 409 资源冲突错误
   */
  static conflict(message: string = '资源冲突'): ApiError {
    return new ApiError('RESOURCE_CONFLICT', message, 409);
  }

  /**
   * 500 服务器内部错误
   */
  static internal(message: string = '服务器内部错误'): ApiError {
    return new ApiError('INTERNAL_ERROR', message, 500);
  }
}
