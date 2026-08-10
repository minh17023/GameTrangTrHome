import { supabase } from '../config/db.js';
import { getRoomId } from '../utils/context.js';

class MusicRepository {
  async getMusic() {
    const { data, error } = await supabase.from('music_tracks').select('*').eq('room_id', getRoomId()).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addMusic(title, url, cover_url) {
    const { data, error } = await supabase.from('music_tracks').insert([{ title, url, cover_url, room_id: getRoomId() }]).select();
    if (error) throw error;
    return data[0];
  }

  async updateMusic(id, title, url, cover_url) {
    const { data, error } = await supabase.from('music_tracks').update({ title, url, cover_url }).eq('id', id).eq('room_id', getRoomId()).select();
    if (error) throw error;
    return data[0];
  }

  async deleteMusic(id) {
    const { error } = await supabase.from('music_tracks').delete().eq('id', id).eq('room_id', getRoomId());
    if (error) throw error;
    return true;
  }
}

export default new MusicRepository();
