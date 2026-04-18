import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
} from './jwt';

describe('JWT Utils', () => {
  const userId = 123;

  describe('generateAccessToken', () => {
    it('应该生成有效的 access token', () => {
      const token = generateAccessToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT 三部分
    });
  });

  describe('generateRefreshToken', () => {
    it('应该生成有效的 refresh token', () => {
      const token = generateRefreshToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('应该验证有效的 access token', () => {
      const token = generateAccessToken(userId);
      const payload = verifyAccessToken(token);

      expect(payload.userId).toBe(userId);
    });

    it('应该抛出错误当 token 无效', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('应该验证有效的 refresh token', () => {
      const token = generateRefreshToken(userId);
      const payload = verifyRefreshToken(token);

      expect(payload.userId).toBe(userId);
    });

    it('应该抛出错误当 token 无效', () => {
      expect(() => {
        verifyRefreshToken('invalid-token');
      }).toThrow();
    });
  });
});
