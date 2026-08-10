import MessageRepository from '../repositories/MessageRepository.js';

class MessageController {
  async getMessages(req, res) {
    try {
      const roomId = req.user.room_id;
      if (!roomId) throw new Error("Chưa ghép đôi");
      
      const messages = await MessageRepository.getMessagesByRoom(roomId);
      res.json({ messages });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const roomId = req.user.room_id;
      if (!roomId) throw new Error("Chưa ghép đôi");

      const { type, content } = req.body;
      const newMessage = await MessageRepository.addMessage({
        room_id: roomId,
        sender_id: req.user.id,
        type: type || 'text',
        content
      });

      // Phát sự kiện realtime qua Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(roomId).emit('chat_message', newMessage);
      }

      res.json({ message: newMessage });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new MessageController();
