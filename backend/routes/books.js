import { Router } from 'express';
import * as booksController from '../controllers/booksController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/cover-search', booksController.searchCover);
router.get('/search-ol',    booksController.searchOpenLibrary);
router.get('/details-ol',   booksController.detailsOpenLibrary);
router.get('/', booksController.getAll);
router.get('/:id', booksController.getById);

// Protected routes (require valid JWT)
router.post('/', authMiddleware, booksController.create);
router.put('/:id', authMiddleware, booksController.update);
router.delete('/:id', authMiddleware, booksController.remove);

export default router;
