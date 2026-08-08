import { supabase } from '../config/db.js';

class ItemRepository {
  async getAllItems() {
    const { data, error } = await supabase.from('items').select('*');
    if (error) throw error;
    return data;
  }

  async updateItemPosition(id, x, y) {
    const { data, error } = await supabase
      .from('items')
      .update({ position_x: x, position_y: y })
      .eq('id', id);
    if (error) throw error;
    return data;
  }
}

export default new ItemRepository();
