import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: number;
}

// 生成随机字符串作为 JWT ID，确保每次生成的 token 都不同
function generateJti(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 生成 Access Token
 * @param userId 用户ID
 * @returns JWT Token
 */
export function generateAccessToken(userId: number): string {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
    jwtid: generateJti(),
  };
  return jwt.sign(
    { userId },
    config.jwt.secret as Secret,
    options
  );
}

/**
 * 生成 Refresh Token
 * @param userId 用户ID
 * @returns JWT Token
 */
export function generateRefreshToken(userId: number): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    jwtid: generateJti(),
  };
  return jwt.sign(
    { userId },
    config.jwt.refreshSecret as Secret,
    options
  );
}

/**
 * 验证 Access Token
 * @param token JWT Token
 * @returns Token 载荷
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret as Secret) as TokenPayload;
}

/**
 * 验证 Refresh Token
 * @param token JWT Token
 * @returns Token 载荷
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret as Secret) as TokenPayload;
}
