import express from 'express';
import PetController from '../controllers/PetController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', PetController.getPet);
router.post('/adopt', PetController.adoptPet);
router.post('/interact', PetController.interact);
router.post('/recover', PetController.recoverStreak);
router.post('/equip', PetController.equipAccessory);

export default router;
