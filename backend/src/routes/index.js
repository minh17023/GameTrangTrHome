import express from 'express';
import fridgeRoutes from './fridgeRoutes.js';
import movieRoutes from './movieRoutes.js';
import phoneRoutes from './phoneRoutes.js';
import musicRoutes from './musicRoutes.js';
import letterRoutes from './letterRoutes.js';
import messageRoutes from './messageRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import itemRoutes from './itemRoutes.js';
import authRoutes from './authRoutes.js';
import photoRoutes from './photoRoutes.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use('/auth', authRoutes);

// Các API dưới đây cần đăng nhập
router.use('/fridge', authMiddleware, fridgeRoutes);
router.use('/movies', authMiddleware, movieRoutes);
router.use('/phone', authMiddleware, phoneRoutes);
router.use('/music', authMiddleware, musicRoutes);
router.use('/letters', authMiddleware, letterRoutes);
router.use('/messages', authMiddleware, messageRoutes);
router.use('/items', authMiddleware, itemRoutes);

// Upload API có thể bảo vệ hoặc public
router.use('/upload', uploadRoutes);
router.use('/photos', authMiddleware, photoRoutes);

export default router;
