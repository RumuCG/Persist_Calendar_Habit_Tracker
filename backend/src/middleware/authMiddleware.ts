import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * JWT 认证中间件
 * 验证请求中的 access_token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // 从 Cookie 中获取 token
    const token = req.cookies[config.cookie.accessTokenName];

    if (!token) {
      throw ApiError.unauthorized('请先登录');
    }

    // 验证 token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new ApiError('TOKEN_EXPIRED', '登录已过期，请重新登录', 401);
        }
      }
      throw ApiError.unauthorized('无效的登录凭证');
    }

    // 将 userId 附加到请求对象
    req.userId = payload.userId;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 可选认证中间件
 * 如果存在 token 则验证，不存在则继续
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies[config.cookie.accessTokenName];

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        req.userId = payload.userId;
      } catch {
        // 验证失败但不阻止请求
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
