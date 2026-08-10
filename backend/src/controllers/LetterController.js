import LetterService from '../services/LetterService.js';

class LetterController {
  async getLetters(req, res) {
    try {
      const data = await LetterService.getLetters();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createLetter(req, res) {
    try {
      const { content } = req.body;
      const data = await LetterService.createLetter(content, req.user.id);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const data = await LetterService.markAsRead(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new LetterController();
