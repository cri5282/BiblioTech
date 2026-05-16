import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import * as profileController from '../controllers/profileController.js';

const router = Router();

// All profile routes require authentication
router.use(authMiddleware);

router.get('/me',           profileController.getMe);
router.put('/me',           profileController.updateMe);
router.put('/me/password',  profileController.changePassword);
router.delete('/me',        profileController.deleteMe);

export default router;
