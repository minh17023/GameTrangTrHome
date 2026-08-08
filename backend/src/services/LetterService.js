import LetterRepository from '../repositories/LetterRepository.js';

class LetterService {
  async getLetter() {
    return await LetterRepository.getLetter();
  }

  async updateLetter(content) {
    if (typeof content !== 'string') {
      throw new Error('Nội dung thư không hợp lệ');
    }
    return await LetterRepository.updateLetter(content);
  }
}

export default new LetterService();
