// Feature: biblioteca-app — Login page tests
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Login from '../pages/Login.jsx';
import AuthContext from '../context/AuthContext.jsx';

vi.mock('../services/api.js', () => ({
  default: {
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

import api from '../services/api.js';

const renderLogin = (isAuthenticated = false) =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider
        value={{
          isAuthenticated,
          user: null,
          login: vi.fn(),
          logout: vi.fn(),
          loading: false,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/books" element={<div data-testid="books-page">Books</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to /books if already authenticated', () => {
    renderLogin(true);
    expect(screen.getByTestId('books-page')).toBeInTheDocument();
  });

  it('should show error message on invalid credentials', async () => {
    api.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLogin(false);

    await userEvent.type(screen.getByLabelText(/email o nome utente/i), 'wrong@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should show validation error when fields are empty', async () => {
    renderLogin(false);
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
