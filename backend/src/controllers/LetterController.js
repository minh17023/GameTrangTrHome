import LetterService from '../services/LetterService.js';

class LetterController {
  async getLetter(req, res) {
    try {
      const data = await LetterService.getLetter();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateLetter(req, res) {
    try {
      const { content } = req.body;
      const data = await LetterService.updateLetter(content);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new LetterController();
