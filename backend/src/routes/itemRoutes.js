import express from 'express';
import ItemController from '../controllers/ItemController.js';

const router = express.Router();

router.get('/', ItemController.getAllItems);
router.put('/:label', ItemController.updateItemPosition);

export default router;
