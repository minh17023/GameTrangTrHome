import ItemRepository from '../repositories/ItemRepository.js';

class ItemService {
  async getAllItems() {
    try {
      return await ItemRepository.getAllItems();
    } catch (error) {
      throw new Error('Error fetching items: ' + error.message);
    }
  }

  async updateItemPosition(id, x, y) {
    try {
      return await ItemRepository.updateItemPosition(id, x, y);
    } catch (error) {
      throw new Error('Error updating item position: ' + error.message);
    }
  }
}

export default new ItemService();
