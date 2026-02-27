const mongoose = require('mongoose');

// Mock dependencies before requiring the controller
jest.mock('jsonwebtoken');
jest.mock('../../models/User');
jest.mock('../../config/sessionConfig', () => ({
  CURRENT_SESSION_VERSION: 2
}));

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const authController = require('../../controllers/authController');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'test-user-id' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 400 when username is missing', async () => {
      req.body = { password: 'somepassword' };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    it('should return 400 when password is missing', async () => {
      req.body = { username: 'admin' };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    it('should return 400 when both username and password are missing', async () => {
      req.body = {};

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    it('should return 401 when user is not found', async () => {
      // Ensure mongoose reports as connected so it takes the normal DB path
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        writable: true,
        configurable: true
      });

      req.body = { username: 'nonexistent', password: 'wrongpass' };
      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );

      // Restore
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: originalReadyState,
        writable: true,
        configurable: true
      });
    });

    it('should return 401 when password does not match', async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        writable: true,
        configurable: true
      });

      const mockUser = {
        _id: 'user-id-123',
        username: 'admin',
        name: 'Admin',
        role: 'admin',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      req.body = { username: 'admin', password: 'wrongpassword' };
      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(res.status).toHaveBeenCalledWith(401);

      Object.defineProperty(mongoose.connection, 'readyState', {
        value: originalReadyState,
        writable: true,
        configurable: true
      });
    });

    it('should return token and user on successful login', async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        writable: true,
        configurable: true
      });

      const mockUser = {
        _id: 'user-id-123',
        username: 'admin',
        name: 'Admin',
        role: 'admin',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      req.body = { username: 'admin', password: 'correctpassword' };
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock-jwt-token');

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'mock-jwt-token',
          user: expect.objectContaining({
            id: 'user-id-123',
            username: 'admin'
          })
        })
      );

      Object.defineProperty(mongoose.connection, 'readyState', {
        value: originalReadyState,
        writable: true,
        configurable: true
      });
    });
  });

  describe('changePassword', () => {
    it('should return 400 when oldPassword is not provided', async () => {
      const mockUser = {
        _id: 'user-id-123',
        username: 'admin',
        comparePassword: jest.fn()
      };

      req.body = { username: 'admin', newPassword: 'newpass123' };
      User.findOne.mockResolvedValue(mockUser);

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    it('should return 400 when username is missing', async () => {
      req.body = { newPassword: 'newpass123', oldPassword: 'oldpass' };

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when newPassword is missing', async () => {
      req.body = { username: 'admin', oldPassword: 'oldpass' };

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user is not found', async () => {
      req.body = { username: 'nonexistent', newPassword: 'newpass', oldPassword: 'oldpass' };
      User.findOne.mockResolvedValue(null);

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 401 when old password does not match', async () => {
      const mockUser = {
        _id: 'user-id-123',
        username: 'admin',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      req.body = { username: 'admin', newPassword: 'newpass', oldPassword: 'wrongoldpass' };
      User.findOne.mockResolvedValue(mockUser);

      await authController.changePassword(req, res);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongoldpass');
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should successfully change password when all fields are valid', async () => {
      const mockUser = {
        _id: 'user-id-123',
        username: 'admin',
        password: 'old-hashed',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      req.body = { username: 'admin', newPassword: 'newpass123', oldPassword: 'correctoldpass' };
      User.findOne.mockResolvedValue(mockUser);

      await authController.changePassword(req, res);

      expect(mockUser.password).toBe('newpass123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});
