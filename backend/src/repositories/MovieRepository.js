import { supabase } from '../config/db.js';
import { getRoomId } from '../utils/context.js';

class MovieRepository {
  async getAllMovies() {
    const { data, error } = await supabase.from('movies').select('*').eq('room_id', getRoomId()).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addMovie(title, time, date) {
    const { data, error } = await supabase.from('movies').insert([{ title, time, date, room_id: getRoomId() }]).select();
    if (error) throw error;
    return data[0];
  }

  async updateMovie(id, title, time, date) {
    const { data, error } = await supabase.from('movies').update({ title, time, date }).eq('id', id).eq('room_id', getRoomId()).select();
    if (error) throw error;
    return data[0];
  }

  async deleteMovie(id) {
    const { error } = await supabase.from('movies').delete().eq('id', id).eq('room_id', getRoomId());
    if (error) throw error;
    return true;
  }
}

export default new MovieRepository();
