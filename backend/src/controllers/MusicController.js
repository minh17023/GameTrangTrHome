import MusicService from '../services/MusicService.js';

class MusicController {
  async getMusic(req, res) {
    try {
      const data = await MusicService.getMusic();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addMusic(req, res) {
    try {
      const { title, url, cover_url } = req.body;
      const data = await MusicService.addMusic(title, url, cover_url);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMusic(req, res) {
    try {
      const { id } = req.params;
      const { title, url, cover_url } = req.body;
      const data = await MusicService.updateMusic(id, title, url, cover_url);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteMusic(req, res) {
    try {
      const { id } = req.params;
      await MusicService.deleteMusic(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new MusicController();
