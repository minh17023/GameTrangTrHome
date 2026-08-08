import { supabase } from '../config/db.js';

class LetterRepository {
  async getLetter() {
    const { data, error } = await supabase.from('letters').select('*').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateLetter(content) {
    const { data, error } = await supabase.from('letters').upsert({ id: 1, content: content }).select();
    if (error) throw error;
    return data[0];
  }
}

export default new LetterRepository();
