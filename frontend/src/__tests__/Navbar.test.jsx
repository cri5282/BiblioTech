// Feature: biblioteca-app — Navbar component tests
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import Navbar from '../components/Navbar.jsx';
import AuthContext from '../context/AuthContext.jsx';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

// Mock api
vi.mock('../services/api.js', () => ({
  default: {
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

afterEach(() => {
  cleanup();
});

const renderNavbar = (isAuthenticated) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          isAuthenticated,
          user: isAuthenticated ? { email: 'test@test.com' } : null,
          logout: vi.fn(),
          loading: false,
        }}
      >
        <Navbar />
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('Navbar', () => {
  // Feature: biblioteca-app, Property 14: Navbar — rendering condizionale in base allo stato di autenticazione
  it('P14: should show correct links based on authentication state', () => {
    fc.assert(
      fc.property(fc.boolean(), (isAuthenticated) => {
        cleanup(); // ensure clean DOM before each iteration
        renderNavbar(isAuthenticated);

        // "Catalogo" is always visible
        expect(screen.getAllByText('Catalogo').length).toBeGreaterThanOrEqual(1);

        if (isAuthenticated) {
          // Authenticated: show "Aggiungi Libro" and avatar button, hide "Login"
          expect(screen.getByText('Aggiungi Libro')).toBeInTheDocument();
          // Logout is now inside the dropdown (closed by default) — check avatar button instead
          expect(screen.getByRole('button', { name: /menu profilo/i })).toBeInTheDocument();
          expect(screen.queryByText('Login')).not.toBeInTheDocument();
        } else {
          // Not authenticated: show "Login" and "Registrati", hide "Aggiungi Libro"
          expect(screen.getByText('Login')).toBeInTheDocument();
          expect(screen.getByText('Registrati')).toBeInTheDocument();
          expect(screen.queryByText('Aggiungi Libro')).not.toBeInTheDocument();
          expect(screen.queryByRole('button', { name: /menu profilo/i })).not.toBeInTheDocument();
        }

        cleanup();
      }),
      { numRuns: 20 }
    );
  });

  it('should show Login link when not authenticated', () => {
    renderNavbar(false);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Registrati')).toBeInTheDocument();
    expect(screen.queryByText('Aggiungi Libro')).not.toBeInTheDocument();
  });

  it('should show Aggiungi Libro and avatar button when authenticated', () => {
    renderNavbar(true);
    expect(screen.getByText('Aggiungi Libro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /menu profilo/i })).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});
