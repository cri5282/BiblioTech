// Feature: biblioteca-app — BookList component tests
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BookList from '../pages/BookList.jsx';
import AuthContext from '../context/AuthContext.jsx';

// Mock api
vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

import api from '../services/api.js';

const renderBookList = (isAuthenticated = false) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{ isAuthenticated, user: null, logout: vi.fn(), loading: false }}
      >
        <BookList />
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('BookList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading indicator while fetching', () => {
    // Never resolves during this test
    api.get.mockReturnValue(new Promise(() => {}));
    renderBookList();
    expect(screen.getByLabelText(/caricamento/i)).toBeInTheDocument();
  });

  it('should show error message when API request fails', async () => {
    api.get.mockRejectedValue({
      response: { data: { message: 'Errore di rete' } },
    });
    renderBookList();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should show "Nessun libro presente" when API returns empty array', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderBookList();
    await waitFor(() => {
      expect(screen.getByText(/nessun libro/i)).toBeInTheDocument();
    });
  });

  it('should render book list when API returns books', async () => {
    api.get.mockResolvedValue({
      data: [
        { _id: '1', title: 'Il Nome della Rosa', author: 'Umberto Eco', year: 1980, genre: 'Romanzo storico' },
        { _id: '2', title: '1984', author: 'George Orwell', year: 1949, genre: 'Distopia' },
      ],
    });
    renderBookList();
    await waitFor(() => {
      expect(screen.getByText('Il Nome della Rosa')).toBeInTheDocument();
      expect(screen.getByText('1984')).toBeInTheDocument();
    });
  });
});
