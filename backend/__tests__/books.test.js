// Feature: biblioteca-app — Books API tests
import fc from 'fast-check';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import Book from '../models/Book.js';

fc.configureGlobal({ numRuns: 50 });

// Arbitraries
const bookArbitrary = fc.record({
  title:  fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
  author: fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
  year:   fc.integer({ min: 1000, max: 2100 }),
  genre:  fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
});

const invalidObjectIdArbitrary = fc
  .stringMatching(/^[a-zA-Z0-9]{1,23}$/)
  .filter((s) => !/^[a-fA-F0-9]{24}$/.test(s));

// Helper: generate a valid access token for protected routes
const makeToken = () =>
  jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), email: 'test@test.com' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/books', () => {
  // Feature: biblioteca-app, Property 1: GET /api/books restituisce tutti i libri ordinati per titolo
  it('P1: should return all books sorted alphabetically by title', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 1, maxLength: 10 }),
        async (books) => {
          await Book.deleteMany({});
          await Book.insertMany(books);

          const res = await request(app).get('/api/books');
          expect(res.status).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(books.length);

          // Verify sorted order using the same comparison MongoDB uses (binary sort)
          for (let i = 1; i < res.body.length; i++) {
            const a = res.body[i - 1].title;
            const b = res.body[i].title;
            // MongoDB sorts by binary string comparison (equivalent to < operator)
            expect(a <= b).toBe(true);
          }
        }
      )
    );
  });

  it('should return empty array when no books exist', async () => {
    await Book.deleteMany({});
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Feature: biblioteca-app, Property 4: Ricerca libri — correttezza e case-insensitivity
  it('P4: search should return only matching books (case-insensitive, partial match)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(bookArbitrary, { minLength: 2, maxLength: 8 }),
        fc.string({ minLength: 2, maxLength: 10 }).filter(s => /^[a-zA-Z]+$/.test(s)),
        async (books, query) => {
          await Book.deleteMany({});
          await Book.insertMany(books);

          const res = await request(app).get(`/api/books?search=${query}`);
          expect(res.status).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);

          const lowerQuery = query.toLowerCase();
          res.body.forEach((book) => {
            const matchesTitle = book.title.toLowerCase().includes(lowerQuery);
            const matchesAuthor = book.author.toLowerCase().includes(lowerQuery);
            expect(matchesTitle || matchesAuthor).toBe(true);
          });
        }
      )
    );
  });
});

describe('GET /api/books/:id', () => {
  // Feature: biblioteca-app, Property 2: Round-trip recupero libro per ID
  it('P2: should return the exact book data for a valid existing ID', async () => {
    await fc.assert(
      fc.asyncProperty(bookArbitrary, async (bookData) => {
        await Book.deleteMany({});
        const saved = await Book.create(bookData);

        const res = await request(app).get(`/api/books/${saved._id}`);
        expect(res.status).toBe(200);
        expect(res.body.title).toBe(saved.title);
        expect(res.body.author).toBe(saved.author);
        expect(res.body.year).toBe(saved.year);
        expect(res.body.genre).toBe(saved.genre);
      })
    );
  });

  // Feature: biblioteca-app, Property 3: ID non valido → 400, ID inesistente → 404
  it('P3: should return 400 for invalid ObjectId format', async () => {
    await fc.assert(
      fc.asyncProperty(invalidObjectIdArbitrary, async (invalidId) => {
        const res = await request(app).get(`/api/books/${invalidId}`);
        expect(res.status).toBe(400);
      })
    );
  });

  it('P3: should return 404 for valid ObjectId that does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/books/${nonExistentId}`);
    expect(res.status).toBe(404);
  });
});

describe('POST/PUT/DELETE /api/books (protected)', () => {
  // Feature: biblioteca-app, Property 11: CRUD round-trip
  it('P11: POST should create a book and return it with HTTP 201', async () => {
    await fc.assert(
      fc.asyncProperty(bookArbitrary, async (bookData) => {
        await Book.deleteMany({});
        const token = makeToken();

        const res = await request(app)
          .post('/api/books')
          .set('Authorization', `Bearer ${token}`)
          .send(bookData);

        expect(res.status).toBe(201);
        expect(res.body.title).toBe(bookData.title.trim());
        expect(res.body.author).toBe(bookData.author.trim());
        expect(res.body.year).toBe(bookData.year);
        expect(res.body.genre).toBe(bookData.genre.trim());
        expect(res.body._id).toBeDefined();
      })
    );
  });

  it('P11: PUT should update a book and return the updated document', async () => {
    await fc.assert(
      fc.asyncProperty(bookArbitrary, bookArbitrary, async (original, updated) => {
        await Book.deleteMany({});
        const saved = await Book.create(original);
        const token = makeToken();

        const res = await request(app)
          .put(`/api/books/${saved._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updated);

        expect(res.status).toBe(200);
        expect(res.body.title).toBe(updated.title.trim());
      })
    );
  });

  it('P11: DELETE should remove a book and subsequent GET should return 404', async () => {
    await fc.assert(
      fc.asyncProperty(bookArbitrary, async (bookData) => {
        await Book.deleteMany({});
        const saved = await Book.create(bookData);
        const token = makeToken();

        const delRes = await request(app)
          .delete(`/api/books/${saved._id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(delRes.status).toBe(200);

        const getRes = await request(app).get(`/api/books/${saved._id}`);
        expect(getRes.status).toBe(404);
      })
    );
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).post('/api/books').send({ title: 'Test', author: 'Test', year: 2000, genre: 'Test' });
    expect(res.status).toBe(401);
  });

  it('should return 400 when required fields are missing on POST', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Only title' });
    expect(res.status).toBe(400);
  });
});
