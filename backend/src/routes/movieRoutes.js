import express from 'express';
import MovieController from '../controllers/MovieController.js';

const router = express.Router();

router.get('/', MovieController.getMovies);
router.post('/', MovieController.addMovie);
router.put('/:id', MovieController.updateMovie);
router.delete('/:id', MovieController.deleteMovie);

export default router;
