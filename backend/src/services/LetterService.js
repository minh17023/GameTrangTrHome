import LetterRepository from '../repositories/LetterRepository.js';

class LetterService {
  async getLetters() {
    return await LetterRepository.getLetters();
  }

  async createLetter(content, senderId) {
    if (typeof content !== 'string') {
      throw new Error('Nội dung thư không hợp lệ');
    }
    return await LetterRepository.createLetter(content, senderId);
  }

  async markAsRead(letterId) {
    if (!letterId) throw new Error('Thiếu ID thư');
    return await LetterRepository.markAsRead(letterId);
  }
}

export default new LetterService();
