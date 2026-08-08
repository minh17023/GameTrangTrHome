import express from 'express';
import FridgeController from '../controllers/FridgeController.js';

const router = express.Router();

router.get('/', FridgeController.getItems);
router.post('/', FridgeController.addItem);
router.put('/:id', FridgeController.updateItem);
router.delete('/:id', FridgeController.deleteItem);

export default router;
