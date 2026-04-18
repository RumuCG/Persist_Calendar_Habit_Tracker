import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: number;
    username: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * 用户注册
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  const { username, email, password } = data;

  // 检查邮箱是否已存在
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError('EMAIL_EXISTS', '邮箱已被注册');
    }
    throw new ApiError('USERNAME_EXISTS', '用户名已被使用');
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  // 创建用户
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
  });

  // 生成 Token
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // 保存 Refresh Token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * 用户登录
 */
export async function login(data: LoginData): Promise<AuthResult> {
  const { email, password } = data;

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError('INVALID_CREDENTIALS', '邮箱或密码错误');
  }

  // 验证密码
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError('INVALID_CREDENTIALS', '邮箱或密码错误');
  }

  // 生成 Token
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // 保存 Refresh Token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * 用户登出
 */
export async function logout(userId: number, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    // 删除指定的 refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  } else {
    // 删除用户的所有 refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
  }
}

/**
 * 刷新 Access Token
 */
export async function refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  // 验证 Refresh Token
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError('TOKEN_INVALID', '无效的刷新令牌');
  }

  // 检查数据库中的 token
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken) {
    throw new ApiError('TOKEN_INVALID', '无效的刷新令牌');
  }

  if (storedToken.expiresAt < new Date()) {
    // 删除过期的 token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new ApiError('TOKEN_EXPIRED', '刷新令牌已过期，请重新登录');
  }

  // 验证用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new ApiError('USER_NOT_FOUND', '用户不存在');
  }

  // 生成新的 Token
  const accessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  // 删除旧的 refresh token
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  // 保存新的 refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError('USER_NOT_FOUND', '用户不存在');
  }

  return user;
}
