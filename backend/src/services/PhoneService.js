import PhoneRepository from '../repositories/PhoneRepository.js';

class PhoneService {
  async getMessages() {
    return await PhoneRepository.getMessages();
  }

  async addMessage(title, audio_url) {
    if (!title || !audio_url) throw new Error('Vui lòng nhập đủ thông tin tin nhắn');
    return await PhoneRepository.addMessage(title, audio_url);
  }

  async updateMessage(id, title, audio_url) {
    if (!title || !audio_url) throw new Error('Vui lòng nhập đủ thông tin tin nhắn');
    return await PhoneRepository.updateMessage(id, title, audio_url);
  }

  async deleteMessage(id) {
    return await PhoneRepository.deleteMessage(id);
  }
}

export default new PhoneService();
