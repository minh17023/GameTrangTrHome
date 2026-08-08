import express from 'express';
import fridgeRoutes from './fridgeRoutes.js';
import movieRoutes from './movieRoutes.js';
import phoneRoutes from './phoneRoutes.js';
import musicRoutes from './musicRoutes.js';
import letterRoutes from './letterRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = express.Router();

router.use('/fridge', fridgeRoutes);
router.use('/movies', movieRoutes);
router.use('/phone', phoneRoutes);
router.use('/music', musicRoutes);
router.use('/letters', letterRoutes);
router.use('/upload', uploadRoutes);

export default router;
