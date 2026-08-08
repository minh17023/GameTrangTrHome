import PhoneService from '../services/PhoneService.js';

class PhoneController {
  async getMessages(req, res) {
    try {
      const data = await PhoneService.getMessages();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addMessage(req, res) {
    try {
      const { title, audio_url } = req.body;
      const data = await PhoneService.addMessage(title, audio_url);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const { title, audio_url } = req.body;
      const data = await PhoneService.updateMessage(id, title, audio_url);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      await PhoneService.deleteMessage(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new PhoneController();
