import { supabase } from '../config/db.js';

class MusicRepository {
  async getMusic() {
    const { data, error } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addMusic(title, url, cover_url) {
    const { data, error } = await supabase.from('music_tracks').insert([{ title, url, cover_url }]).select();
    if (error) throw error;
    return data[0];
  }

  async updateMusic(id, title, url, cover_url) {
    const { data, error } = await supabase.from('music_tracks').update({ title, url, cover_url }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async deleteMusic(id) {
    const { error } = await supabase.from('music_tracks').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export default new MusicRepository();
