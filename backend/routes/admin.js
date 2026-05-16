import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// All admin routes require valid JWT + admin role
router.use(authMiddleware, adminAuth);

router.get('/stats',                    adminController.getStats);
router.get('/users',                    adminController.getUsers);
router.get('/users/:id',               adminController.getUserById);
router.post('/users',                   adminController.createUser);
router.put('/users/:id',               adminController.updateUser);
router.delete('/users/:id',            adminController.deleteUser);

export default router;
