// Feature: biblioteca-app — Model validation tests
import fc from 'fast-check';
import Book from '../models/Book.js';

fc.configureGlobal({ numRuns: 100 });

// Arbitrary for a valid book
const bookArbitrary = fc.record({
  title:  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  author: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  year:   fc.integer({ min: 1000, max: 2100 }),
  genre:  fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
});

describe('Book Model', () => {
  // Feature: biblioteca-app, Property 5: Validazione schema Book — campi obbligatori
  it('P5: should reject a Book document with missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.subarray(['title', 'author', 'year', 'genre'], { minLength: 1 }),
        bookArbitrary,
        async (missingFields, validBook) => {
          const bookData = { ...validBook };
          missingFields.forEach((field) => delete bookData[field]);

          const book = new Book(bookData);
          let threw = false;
          try {
            await book.validate();
          } catch (err) {
            threw = true;
            expect(err.name).toBe('ValidationError');
          }
          expect(threw).toBe(true);
        }
      )
    );
  });

  it('should save a valid Book document successfully', async () => {
    await fc.assert(
      fc.asyncProperty(bookArbitrary, async (bookData) => {
        const book = new Book(bookData);
        const saved = await book.save();
        expect(saved._id).toBeDefined();
        expect(saved.title).toBe(bookData.title.trim());
        expect(saved.author).toBe(bookData.author.trim());
        expect(saved.year).toBe(bookData.year);
        expect(saved.genre).toBe(bookData.genre.trim());
      })
    );
  });
});
