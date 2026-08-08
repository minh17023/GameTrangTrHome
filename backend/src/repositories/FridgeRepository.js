import { supabase } from '../config/db.js';

class FridgeRepository {
  async getAllItems() {
    const { data, error } = await supabase.from('fridge_items').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async addItem(name) {
    const { data, error } = await supabase.from('fridge_items').insert([{ name }]).select();
    if (error) throw error;
    return data[0];
  }

  async updateItem(id, name) {
    const { data, error } = await supabase.from('fridge_items').update({ name }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async deleteItem(id) {
    const { error } = await supabase.from('fridge_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

export default new FridgeRepository();
