import express from 'express';
import MessageController from '../controllers/MessageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, MessageController.getMessages);
router.post('/', authMiddleware, MessageController.sendMessage);

export default router;
