import PhotoService from '../services/PhotoService.js';

class PhotoController {
  async getPhotos(req, res) {
    try {
      const data = await PhotoService.getPhotos();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createPhoto(req, res) {
    try {
      const { url } = req.body;
      const data = await PhotoService.createPhoto(url, req.user.id);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async toggleFavorite(req, res) {
    try {
      const data = await PhotoService.toggleFavorite(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deletePhoto(req, res) {
    try {
      await PhotoService.deletePhoto(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PhotoController();
