import MusicRepository from '../repositories/MusicRepository.js';

class MusicService {
  async getMusic() {
    return await MusicRepository.getMusic();
  }

  async addMusic(title, url, cover_url) {
    if (!title || !url || !cover_url) {
      throw new Error('Thiếu thông tin bài hát (title, url, cover_url)');
    }
    return await MusicRepository.addMusic(title, url, cover_url);
  }

  async updateMusic(id, title, url, cover_url) {
    if (!id || !title || !url || !cover_url) {
      throw new Error('Thiếu thông tin cập nhật bài hát');
    }
    return await MusicRepository.updateMusic(id, title, url, cover_url);
  }

  async deleteMusic(id) {
    if (!id) throw new Error('Thiếu ID bài hát để xóa');
    return await MusicRepository.deleteMusic(id);
  }
}

export default new MusicService();
