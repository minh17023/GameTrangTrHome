import FridgeService from '../services/FridgeService.js';

class FridgeController {
  async getItems(req, res) {
    try {
      const data = await FridgeService.getItems();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addItem(req, res) {
    try {
      const { name } = req.body;
      const data = await FridgeService.addItem(name);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const data = await FridgeService.updateItem(id, name);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      await FridgeService.deleteItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new FridgeController();
