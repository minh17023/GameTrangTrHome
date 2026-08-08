import express from 'express';
import LetterController from '../controllers/LetterController.js';

const router = express.Router();

router.get('/', LetterController.getLetter);
router.put('/', LetterController.updateLetter);

export default router;
