// Feature: biblioteca-app — AuthContext tests
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';

// Mock axios for refresh calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockRejectedValue(new Error('No refresh')),
    create: vi.fn(() => ({
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    })),
  },
}));

// Helper component to expose auth state
const AuthStateDisplay = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      <span data-testid="is-auth">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email || ''}</span>
    </div>
  );
};

const renderWithAuth = () =>
  render(
    <AuthProvider>
      <AuthStateDisplay />
    </AuthProvider>
  );

// Create a valid-looking JWT (not actually verified, just decoded client-side)
const makeJwt = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Feature: biblioteca-app, Property 15: Ripristino sessione — token valido in localStorage
  it('P15: should restore authenticated state from valid non-expired accessToken in localStorage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 24 }),
          email:  fc.emailAddress(),
        }),
        async ({ userId, email }) => {
          localStorage.clear();

          // Create a non-expired token (exp = now + 15 min)
          const exp = Math.floor(Date.now() / 1000) + 900;
          const token = makeJwt({ userId, email, exp });
          localStorage.setItem('accessToken', token);

          const { unmount } = renderWithAuth();

          await waitFor(() => {
            expect(screen.getByTestId('is-auth').textContent).toBe('true');
          });

          unmount();
          localStorage.clear();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should not be authenticated when no token in localStorage', async () => {
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('is-auth').textContent).toBe('false');
    });
  });

  it('should not be authenticated when token is expired', async () => {
    const exp = Math.floor(Date.now() / 1000) - 100; // expired
    const token = makeJwt({ userId: 'test', email: 'test@test.com', exp });
    localStorage.setItem('accessToken', token);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('is-auth').textContent).toBe('false');
    });
  });
});
