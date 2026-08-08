import ItemService from '../services/ItemService.js';

class ItemController {
  async getAllItems(req, res) {
    try {
      const items = await ItemService.getAllItems();
      res.status(200).json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateItemPosition(req, res) {
    try {
      const { id } = req.params;
      const { x, y } = req.body;
      const updatedItem = await ItemService.updateItemPosition(id, x, y);
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ItemController();
