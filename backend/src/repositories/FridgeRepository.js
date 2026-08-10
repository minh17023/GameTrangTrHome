import { supabase } from '../config/db.js';
import { getRoomId } from '../utils/context.js';

class FridgeRepository {
  async getItems() {
    const { data, error } = await supabase.from('fridge_items').select('*').eq('room_id', getRoomId()).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async addItem(name) {
    const { data, error } = await supabase.from('fridge_items').insert([{ name, room_id: getRoomId() }]).select();
    if (error) throw error;
    return data[0];
  }

  async updateItem(id, name) {
    const { data, error } = await supabase.from('fridge_items').update({ name }).eq('id', id).eq('room_id', getRoomId()).select();
    if (error) throw error;
    return data[0];
  }

  async deleteItem(id) {
    const { error } = await supabase.from('fridge_items').delete().eq('id', id).eq('room_id', getRoomId());
    if (error) throw error;
    return true;
  }
}

export default new FridgeRepository();
