const jwt = require('jsonwebtoken');

// Mock dependencies before requiring the middleware
jest.mock('jsonwebtoken');
jest.mock('../../models/User');
jest.mock('../../config/sessionConfig', () => ({
  CURRENT_SESSION_VERSION: 2
}));

const User = require('../../models/User');
const authMiddleware = require('../../middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Missing Token', () => {
    it('should return 401 when no authorization header is provided', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header has no Bearer token', async () => {
      req.headers.authorization = 'Bearer ';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token', () => {
    it('should return 401 when jwt.verify throws an error', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token has expired', async () => {
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when session version is missing from token', async () => {
      req.headers.authorization = 'Bearer valid-token-no-session';
      jwt.verify.mockReturnValue({ id: 'user-id-123' });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when session version does not match', async () => {
      req.headers.authorization = 'Bearer valid-token-old-session';
      jwt.verify.mockReturnValue({ id: 'user-id-123', sessionVersion: 1 });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Valid Token', () => {
    it('should call next() and attach user to req when token is valid', async () => {
      const mockUser = {
        _id: 'user-id-123',
        username: 'admin',
        name: 'Test Admin',
        role: 'admin'
      };

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({
        id: 'user-id-123',
        sessionVersion: 2
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith('user-id-123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found in database', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({
        id: 'nonexistent-user-id',
        sessionVersion: 2
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
