import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/authService';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';

// 设置 Cookie 的辅助函数
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(config.cookie.accessTokenName, accessToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.accessTokenMaxAge,
  });

  res.cookie(config.cookie.refreshTokenName, refreshToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.refreshTokenMaxAge,
  });
}

// 清除 Cookie 的辅助函数
function clearAuthCookies(res: Response) {
  res.clearCookie(config.cookie.accessTokenName);
  res.clearCookie(config.cookie.refreshTokenName);
}

// 注册验证规则
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在 3-20 个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少为 8 位')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含字母和数字'),
];

// 登录验证规则
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
];

/**
 * 用户注册
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const result = await authService.register(req.body);

    // 设置 Cookie
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
      },
      message: '注册成功',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 用户登录
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    // 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('VALIDATION_ERROR', errors.array()[0].msg);
    }

    const result = await authService.login(req.body);

    // 设置 Cookie
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      success: true,
      data: {
        user: result.user,
      },
      message: '登录成功',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 用户登出
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const refreshToken = req.cookies[config.cookie.refreshTokenName];

    if (userId) {
      await authService.logout(userId, refreshToken);
    }

    // 清除 Cookie
    clearAuthCookies(res);

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 刷新 Token
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies[config.cookie.refreshTokenName];

    if (!refreshToken) {
      throw new ApiError('TOKEN_MISSING', '缺少刷新令牌', 401);
    }

    const result = await authService.refreshToken(refreshToken);

    // 设置新的 Cookie
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      success: true,
      message: '令牌刷新成功',
    });
  } catch (error) {
    // 刷新失败时清除 Cookie
    clearAuthCookies(res);
    next(error);
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new ApiError('UNAUTHORIZED', '未登录');
    }

    const user = await authService.getCurrentUser(userId);

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}
