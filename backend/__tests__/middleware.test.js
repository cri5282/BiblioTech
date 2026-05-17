// Feature: biblioteca-app — Auth Middleware tests
import { jest } from '@jest/globals';
import fc from 'fast-check';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth.js';

fc.configureGlobal({ numRuns: 100 });

// Helper to create a mock Express req/res/next
const mockReqResNext = (authHeader) => {
  const req = { headers: { authorization: authHeader } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

describe('Auth Middleware', () => {
  // Feature: biblioteca-app, Property 10: Auth middleware — decodifica corretta del payload JWT
  it('P10: should decode valid JWT and attach payload to req.user without modification', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          email:  fc.emailAddress(),
        }),
        ({ userId, email }) => {
          const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '15m' });
          const { req, res, next } = mockReqResNext(`Bearer ${token}`);

          authMiddleware(req, res, next);

          expect(next).toHaveBeenCalledTimes(1);
          expect(req.user).toBeDefined();
          expect(req.user.userId).toBe(userId);
          expect(req.user.email).toBe(email);

          // Reset mocks for next iteration
          next.mockClear();
        }
      )
    );
  });

  it('should return 401 when Authorization header is missing', () => {
    const { req, res, next } = mockReqResNext(undefined);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', () => {
    const { req, res, next } = mockReqResNext('Bearer invalid.token.here');
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when token is expired', () => {
    const expiredToken = jwt.sign(
      { userId: 'test', email: 'test@test.com' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // already expired
    );
    const { req, res, next } = mockReqResNext(`Bearer ${expiredToken}`);
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
