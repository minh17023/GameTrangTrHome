import { supabase } from '../config/db.js';

class MovieRepository {
  async getAllMovies() {
    const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addMovie(title, time, date) {
    const { data, error } = await supabase.from('movies').insert([{ title, time, date }]).select();
    if (error) throw error;
    return data[0];
  }

  async updateMovie(id, title, time, date) {
    const { data, error } = await supabase.from('movies').update({ title, time, date }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async deleteMovie(id) {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export default new MovieRepository();
