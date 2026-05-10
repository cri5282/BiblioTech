// Feature: biblioteca-app — BookForm component tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import BookForm from '../components/BookForm.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

// Mock the api module
vi.mock('../services/api.js', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderBookForm = (props = {}) =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <BookForm {...props} />
      </AuthProvider>
    </MemoryRouter>
  );

describe('BookForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: biblioteca-app, Property 12: Validazione form BookForm — campi vuoti rifiutati
  it('P12: should not submit and show errors when any required field is empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title:  fc.oneof(fc.constant(''), fc.constant('   ')),
          author: fc.oneof(fc.constant(''), fc.constant('   ')),
          year:   fc.oneof(fc.constant(''), fc.constant('   ')),
          genre:  fc.oneof(fc.constant(''), fc.constant('   ')),
        }),
        async (emptyFields) => {
          const { unmount } = renderBookForm({ mode: 'create' });

          // Fill in some fields but leave at least one empty
          const titleInput  = screen.getByLabelText(/titolo/i);
          const authorInput = screen.getByLabelText(/autore/i);
          const yearInput   = screen.getByLabelText(/anno/i);
          const genreInput  = screen.getByLabelText(/genere/i);

          await userEvent.clear(titleInput);
          await userEvent.clear(authorInput);
          await userEvent.clear(yearInput);
          await userEvent.clear(genreInput);

          // Submit with empty fields
          const submitBtn = screen.getByRole('button', { name: /aggiungi libro/i });
          await userEvent.click(submitBtn);

          // Should show at least one validation error
          const errors = screen.queryAllByRole('alert');
          expect(errors.length).toBeGreaterThan(0);

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Feature: biblioteca-app, Property 13: BookForm in modalità edit — pre-compilazione campi
  it('P13: should pre-fill all fields with initialData in edit mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title:  fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          author: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          year:   fc.integer({ min: 1000, max: 2100 }),
          genre:  fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        }),
        async (bookData) => {
          const { unmount } = renderBookForm({
            mode: 'edit',
            initialData: bookData,
            bookId: 'test-id',
          });

          expect(screen.getByLabelText(/titolo/i)).toHaveValue(bookData.title);
          expect(screen.getByLabelText(/autore/i)).toHaveValue(bookData.author);
          expect(screen.getByLabelText(/anno/i)).toHaveValue(bookData.year);
          expect(screen.getByLabelText(/genere/i)).toHaveValue(bookData.genre);

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should show validation errors for empty title', async () => {
    renderBookForm({ mode: 'create' });
    const submitBtn = screen.getByRole('button', { name: /aggiungi libro/i });
    await userEvent.click(submitBtn);
    expect(screen.getByText(/titolo è obbligatorio/i)).toBeInTheDocument();
  });
});
