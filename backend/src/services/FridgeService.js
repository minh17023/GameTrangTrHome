import FridgeRepository from '../repositories/FridgeRepository.js';

class FridgeService {
  async getItems() {
    return await FridgeRepository.getItems();
  }

  async addItem(name) {
    if (!name || name.trim() === '') {
      throw new Error('Tên món ăn không được để trống');
    }
    return await FridgeRepository.addItem(name.trim());
  }

  async updateItem(id, name) {
    if (!name || name.trim() === '') {
      throw new Error('Tên món ăn không được để trống');
    }
    return await FridgeRepository.updateItem(id, name.trim());
  }

  async deleteItem(id) {
    return await FridgeRepository.deleteItem(id);
  }
}

export default new FridgeService();
