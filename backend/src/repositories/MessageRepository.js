import { supabase } from '../config/db.js';

class MessageRepository {
  async getMessagesByRoom(roomId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async addMessage(messageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}

export default new MessageRepository();
