import express from 'express';
import LetterController from '../controllers/LetterController.js';

const router = express.Router();

router.get('/', LetterController.getLetters);
router.post('/', LetterController.createLetter);
router.put('/:id/read', LetterController.markAsRead);

export default router;
