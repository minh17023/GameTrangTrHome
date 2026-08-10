import { supabase } from '../config/db.js';
import { getRoomId } from '../utils/context.js';

class LetterRepository {
  async getLetters() {
    const { data, error } = await supabase.from('letters')
      .select('*')
      .eq('room_id', getRoomId())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createLetter(content, senderId) {
    const { data, error } = await supabase.from('letters')
      .insert([
        { content: content, room_id: getRoomId(), sender_id: senderId, is_read: false }
      ])
      .select();
    if (error) throw error;
    return data[0];
  }

  async markAsRead(letterId) {
    const { data, error } = await supabase.from('letters')
      .update({ is_read: true })
      .eq('id', letterId)
      .eq('room_id', getRoomId())
      .select();
    if (error) throw error;
    return data?.[0];
  }
}

export default new LetterRepository();
