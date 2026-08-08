import express from 'express';
import MusicController from '../controllers/MusicController.js';

const router = express.Router();

router.get('/', MusicController.getMusic);
router.post('/', MusicController.addMusic);
router.put('/:id', MusicController.updateMusic);
router.delete('/:id', MusicController.deleteMusic);

export default router;
