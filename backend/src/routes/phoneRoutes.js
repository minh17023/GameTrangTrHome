import express from 'express';
import PhoneController from '../controllers/PhoneController.js';

const router = express.Router();

router.get('/', PhoneController.getMessages);
router.post('/', PhoneController.addMessage);
router.put('/:id', PhoneController.updateMessage);
router.delete('/:id', PhoneController.deleteMessage);

export default router;
