import express from 'express';
import PhotoController from '../controllers/PhotoController.js';

const router = express.Router();

router.get('/', PhotoController.getPhotos);
router.post('/', PhotoController.createPhoto);
router.put('/:id/favorite', PhotoController.toggleFavorite);
router.delete('/:id', PhotoController.deletePhoto);

export default router;
