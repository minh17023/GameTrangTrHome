import MusicRepository from '../repositories/MusicRepository.js';

class MusicService {
  async getMusic() {
    return await MusicRepository.getMusic();
  }

  async updateMusic(url) {
    if (typeof url !== 'string' || !url.trim()) {
      throw new Error('Đường dẫn nhạc không hợp lệ');
    }
    return await MusicRepository.updateMusic(url.trim());
  }
}

export default new MusicService();
