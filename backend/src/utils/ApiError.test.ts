import { ApiError } from './ApiError';

describe('ApiError', () => {
  describe('构造函数', () => {
    it('应该创建带有正确属性的错误', () => {
      const error = new ApiError('TEST_ERROR', '测试错误', 400);

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('测试错误');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('应该使用默认状态码 400', () => {
      const error = new ApiError('TEST_ERROR', '测试错误');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('静态工厂方法', () => {
    it('unauthorized 应该创建 401 错误', () => {
      const error = ApiError.unauthorized('未授权');

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('未授权');
    });

    it('unauthorized 应该使用默认消息', () => {
      const error = ApiError.unauthorized();
      expect(error.message).toBe('未授权访问');
    });

    it('forbidden 应该创建 403 错误', () => {
      const error = ApiError.forbidden('禁止访问');

      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });

    it('notFound 应该创建 404 错误', () => {
      const error = ApiError.notFound('资源不存在');

      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('conflict 应该创建 409 错误', () => {
      const error = ApiError.conflict('资源冲突');

      expect(error.code).toBe('RESOURCE_CONFLICT');
      expect(error.statusCode).toBe(409);
    });

    it('internal 应该创建 500 错误', () => {
      const error = ApiError.internal('服务器错误');

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });
});
