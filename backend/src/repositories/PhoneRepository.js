import { supabase } from '../config/db.js';
import { getRoomId } from '../utils/context.js';

class PhoneRepository {
  async getMessages() {
    const { data, error } = await supabase.from('voice_messages').select('*').eq('room_id', getRoomId()).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addMessage(title, audio_url) {
    const { data, error } = await supabase.from('voice_messages').insert([{ title, audio_url, room_id: getRoomId() }]).select();
    if (error) throw error;
    return data[0];
  }

  async updateMessage(id, title, audio_url) {
    const { data, error } = await supabase.from('voice_messages').update({ title, audio_url }).eq('id', id).eq('room_id', getRoomId()).select();
    if (error) throw error;
    return data[0];
  }

  async deleteMessage(id) {
    const { error } = await supabase.from('voice_messages').delete().eq('id', id).eq('room_id', getRoomId());
    if (error) throw error;
    return true;
  }
}

export default new PhoneRepository();
