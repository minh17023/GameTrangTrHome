import express from 'express';
import multer from 'multer';
import UploadController from '../controllers/UploadController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), UploadController.uploadFile);

export default router;
