// Feature: biblioteca-app — BookDetail component tests
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BookDetail from '../pages/BookDetail.jsx';
import AuthContext from '../context/AuthContext.jsx';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

import api from '../services/api.js';

const mockBook = {
  _id: '64a1b2c3d4e5f6a7b8c9d0e1',
  title: 'Il Nome della Rosa',
  author: 'Umberto Eco',
  year: 1980,
  genre: 'Romanzo storico',
};

const renderBookDetail = (isAuthenticated = false, bookId = mockBook._id) =>
  render(
    <MemoryRouter initialEntries={[`/books/${bookId}`]}>
      <AuthContext.Provider
        value={{ isAuthenticated, user: null, logout: vi.fn(), loading: false }}
      >
        <Routes>
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/books" element={<div>Book List</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('BookDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Libro non trovato" when API returns 404', async () => {
    api.get.mockRejectedValue({ response: { status: 404 } });
    renderBookDetail();
    await waitFor(() => {
      expect(screen.getByText(/libro non trovato/i)).toBeInTheDocument();
    });
  });

  it('should hide delete button for unauthenticated users', async () => {
    api.get.mockResolvedValue({ data: mockBook });
    renderBookDetail(false);
    await waitFor(() => {
      expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /elimina/i })).not.toBeInTheDocument();
  });

  it('should show delete button for authenticated users', async () => {
    api.get.mockResolvedValue({ data: mockBook });
    renderBookDetail(true);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /elimina/i })).toBeInTheDocument();
    });
  });

  it('should close modal without sending request when user cancels deletion', async () => {
    api.get.mockResolvedValue({ data: mockBook });
    renderBookDetail(true);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /elimina/i })).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /elimina/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByRole('button', { name: /annulla/i }));

    // Modal should be closed and no DELETE request sent
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
  });
});
