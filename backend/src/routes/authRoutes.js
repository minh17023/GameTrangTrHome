import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/pair', authMiddleware, AuthController.pairCouple);
router.get('/pair-requests', authMiddleware, AuthController.getPairRequests);
router.post('/accept-pair', authMiddleware, AuthController.acceptPairRequest);
router.get('/partner', authMiddleware, AuthController.getPartner);

export default router;
