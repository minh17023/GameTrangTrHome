import PhotoRepository from '../repositories/PhotoRepository.js';

class PhotoService {
  async getPhotos() {
    return await PhotoRepository.getPhotos();
  }

  async createPhoto(url, uploaderId) {
    if (!url) {
      throw new Error('Đường dẫn ảnh không hợp lệ');
    }
    return await PhotoRepository.createPhoto(url, uploaderId);
  }

  async toggleFavorite(id) {
    if (!id) throw new Error('Thiếu ID ảnh');
    return await PhotoRepository.toggleFavorite(id);
  }

  async deletePhoto(id) {
    if (!id) throw new Error('Thiếu ID ảnh');
    return await PhotoRepository.deletePhoto(id);
  }
}

export default new PhotoService();
