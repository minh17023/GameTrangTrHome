import UploadService from '../services/UploadService.js';

class UploadController {
  async uploadFile(req, res) {
    try {
      const file = req.file; // File được lấy từ multer
      const { prefix } = req.body;
      const publicUrl = await UploadService.uploadFile(file, prefix || '');
      res.json({ url: publicUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UploadController();
