import mongoose from 'mongoose';
import https from 'https';
import Book from '../models/Book.js';

// filtra i subject Open Library troppo generici
const SKIP_SUBJECTS = new Set([
  'fiction','nonfiction','non-fiction','accessible book','protected daisy',
  'in library','overdrive','open library','internet archive','large type books',
  'english language','juvenile fiction','juvenile literature','children',
  'readable','lending library','borrow','ebook','audiobook',
]);

const pickBestGenre = (subjects) => {
  if (!subjects || subjects.length === 0) return '';
  const cleaned = subjects
    .map(s => s.trim())
    .filter(s => {
      const lower = s.toLowerCase();
      if (SKIP_SUBJECTS.has(lower)) return false;
      if (s.length > 40) return false;
      return true;
    });
  return cleaned[0] || subjects[0] || '';
};

const fetchCoverFromOpenLibrary = (title, author) =>
  new Promise((resolve) => {
    const query = encodeURIComponent(`${title} ${author}`);
    const url = `https://openlibrary.org/search.json?q=${query}&limit=5&fields=key,title,author_name,cover_i,isbn`;

    https.get(url, { headers: { 'User-Agent': 'BibliotecaApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const docs = json.docs || [];
          // Find first doc with a cover
          const withCover = docs.find(d => d.cover_i);
          if (withCover) {
            resolve(`https://covers.openlibrary.org/b/id/${withCover.cover_i}-L.jpg`);
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        }
      });
      res.on('error', () => resolve(''));
    }).on('error', () => resolve(''));
  });

// GET /api/books/cover-search?title=...&author=...  (public)
export const searchCover = async (req, res, next) => {
  try {
    const { title = '', author = '' } = req.query;
    if (!title.trim() && !author.trim()) {
      return res.status(400).json({ message: 'title or author required' });
    }
    const coverUrl = await fetchCoverFromOpenLibrary(title, author);
    res.status(200).json({ coverUrl });
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};

// GET /api/books/search-ol?q=...  — search Open Library for autocomplete (public)
export const searchOpenLibrary = async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) return res.status(400).json({ message: 'q required' });

    const query = encodeURIComponent(q.trim());
    const url = `https://openlibrary.org/search.json?q=${query}&limit=8&fields=key,title,author_name,first_publish_year,subject,cover_i,isbn,first_sentence`;

    const results = await new Promise((resolve) => {
      https.get(url, { headers: { 'User-Agent': 'BibliotecaApp/1.0' } }, (olRes) => {
        let data = '';
        olRes.on('data', chunk => { data += chunk; });
        olRes.on('end', () => {
          try {
            const json = JSON.parse(data);
            const books = (json.docs || []).map(doc => {
              // Pick the most meaningful genre: skip generic tags, prefer specific ones
              const subjects = (doc.subject || []);
              const genre = pickBestGenre(subjects);

              // Synopsis: use first_sentence if available
              let synopsis = '';
              if (doc.first_sentence) {
                synopsis = typeof doc.first_sentence === 'string'
                  ? doc.first_sentence
                  : (doc.first_sentence.value || '');
              }

              return {
                key:      doc.key || '',
                title:    doc.title || '',
                author:   (doc.author_name || [])[0] || '',
                year:     doc.first_publish_year || null,
                genre,
                synopsis,
                coverUrl: doc.cover_i
                  ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                  : '',
              };
            });
            resolve(books);
          } catch {
            resolve([]);
          }
        });
        olRes.on('error', () => resolve([]));
      }).on('error', () => resolve([]));
    });

    res.status(200).json(results);
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};

// GET /api/books/details-ol?key=...  — fetch full book details from Open Library (public)
export const detailsOpenLibrary = async (req, res, next) => {
  try {
    const { key = '' } = req.query;
    if (!key.trim()) return res.status(400).json({ message: 'key required' });

    // key is like /works/OL123W
    const url = `https://openlibrary.org${key}.json`;

    const details = await new Promise((resolve) => {
      https.get(url, { headers: { 'User-Agent': 'BibliotecaApp/1.0' } }, (olRes) => {
        let data = '';
        olRes.on('data', chunk => { data += chunk; });
        olRes.on('end', () => {
          try {
            const json = JSON.parse(data);

            // Extract description
            let synopsis = '';
            if (json.description) {
              synopsis = typeof json.description === 'string'
                ? json.description
                : (json.description.value || '');
            }

            // Extract subjects/genre
            const subjects = json.subjects || [];
            const genre = pickBestGenre(subjects);

            resolve({ synopsis, genre });
          } catch {
            resolve({ synopsis: '', genre: '' });
          }
        });
        olRes.on('error', () => resolve({ synopsis: '', genre: '' }));
      }).on('error', () => resolve({ synopsis: '', genre: '' }));
    });

    res.status(200).json(details);
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};

// GET /api/books  (+ ?search=)
export const getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query = { $or: [{ title: regex }, { author: regex }] };
    }

    const books = await Book.find(query).sort({ title: 1 });
    res.status(200).json(books);
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};

// GET /api/books/:id
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Strict ObjectId validation: must be exactly 24 hex characters
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};

// POST /api/books  (protected)
export const create = async (req, res, next) => {
  try {
    const { title, author, year, genre, synopsis, coverUrl } = req.body;

    if (!title || !author || year === undefined || year === null || !genre) {
      return res.status(400).json({ message: 'All fields are required: title, author, year, genre' });
    }

    const book = new Book({ title, author, year, genre, synopsis: synopsis || '', coverUrl: coverUrl || '' });
    await book.save();

    res.status(201).json(book);
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};

// PUT /api/books/:id  (protected)
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const book = await Book.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};

// DELETE /api/books/:id  (protected)
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Libro eliminato con successo' });
  } catch (err) {
    console.log('books error:', err.message);
    next(err);
  }
};
