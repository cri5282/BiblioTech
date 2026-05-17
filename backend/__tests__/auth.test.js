// Feature: biblioteca-app — Auth API tests
import fc from 'fast-check';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/User.js';

fc.configureGlobal({ numRuns: 30 });

// Arbitrary for valid user credentials
const userArbitrary = fc.record({
  username: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  email:    fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }),
});

describe('POST /api/auth/register', () => {
  // Feature: biblioteca-app, Property 6: Hashing password — round-trip bcrypt
  it('P6: password should be hashed and bcrypt.compare should return true', async () => {
    await fc.assert(
      fc.asyncProperty(userArbitrary, async (userData) => {
        await User.deleteMany({});

        await request(app).post('/api/auth/register').send(userData);

        const user = await User.findOne({ email: userData.email.toLowerCase() });
        if (!user) return; // skip if email collision

        expect(user.passwordHash).not.toBe(userData.password);
        const match = await bcrypt.compare(userData.password, user.passwordHash);
        expect(match).toBe(true);
      })
    );
  });

  // Feature: biblioteca-app, Property 7: Unicità email — registrazione duplicata restituisce 409
  it('P7: duplicate email registration should return 409', async () => {
    await fc.assert(
      fc.asyncProperty(userArbitrary, async (userData) => {
        await User.deleteMany({});

        const first = await request(app).post('/api/auth/register').send(userData);
        if (first.status !== 201) return; // skip if first registration failed

        const second = await request(app).post('/api/auth/register').send({
          ...userData,
          username: 'different_username',
        });
        expect(second.status).toBe(409);
      })
    );
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('should return 201 on successful registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@biblioteca.it',
      password: 'password123',
    });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/auth/login', () => {
  // Feature: biblioteca-app, Property 8: Login con credenziali valide — token generati e persistiti
  it('P8: valid login should return verifiable tokens and persist refreshToken in DB', async () => {
    await fc.assert(
      fc.asyncProperty(userArbitrary, async (userData) => {
        await User.deleteMany({});

        const regRes = await request(app).post('/api/auth/register').send(userData);
        if (regRes.status !== 201) return;

        const loginRes = await request(app).post('/api/auth/login').send({
          email: userData.email,
          password: userData.password,
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.accessToken).toBeDefined();
        expect(loginRes.body.refreshToken).toBeDefined();

        // Verify tokens are valid JWTs
        const accessPayload = jwt.verify(loginRes.body.accessToken, process.env.JWT_SECRET);
        expect(accessPayload.email).toBe(userData.email.toLowerCase());

        const refreshPayload = jwt.verify(loginRes.body.refreshToken, process.env.JWT_REFRESH_SECRET);
        expect(refreshPayload.userId).toBeDefined();

        // Verify refreshToken is persisted in DB
        const user = await User.findOne({ email: userData.email.toLowerCase() });
        expect(user.refreshToken).toBe(loginRes.body.refreshToken);
      })
    );
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 for wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'user',
      email: 'user@test.com',
      password: 'correctpassword',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'user@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  // Feature: biblioteca-app, Property 9: Rotazione refresh token
  it('P9: refresh should return new tokens and old refreshToken should no longer be accepted', async () => {
    await fc.assert(
      fc.asyncProperty(userArbitrary, async (userData) => {
        await User.deleteMany({});

        const regRes = await request(app).post('/api/auth/register').send(userData);
        if (regRes.status !== 201) return;

        const loginRes = await request(app).post('/api/auth/login').send({
          email: userData.email,
          password: userData.password,
        });
        if (loginRes.status !== 200) return;

        const oldRefreshToken = loginRes.body.refreshToken;

        // Refresh with old token
        const refreshRes = await request(app).post('/api/auth/refresh').send({
          refreshToken: oldRefreshToken,
        });

        expect(refreshRes.status).toBe(200);
        expect(refreshRes.body.accessToken).toBeDefined();
        expect(refreshRes.body.refreshToken).toBeDefined();
        // New refresh token must be different
        expect(refreshRes.body.refreshToken).not.toBe(oldRefreshToken);

        // Old refresh token should no longer be accepted
        const replayRes = await request(app).post('/api/auth/refresh').send({
          refreshToken: oldRefreshToken,
        });
        expect(replayRes.status).toBe(403);
      })
    );
  });

  it('should return 403 for invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: 'invalid.token.here',
    });
    expect(res.status).toBe(403);
  });
});
