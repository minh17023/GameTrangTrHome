import { supabase } from '../config/db.js';

class ItemRepository {
  async getAllItems() {
    const { data, error } = await supabase.from('items').select('*');
    if (error) throw error;
    return data;
  }

  async updateItemPosition(label, x, y) {
    const { data, error } = await supabase
      .from('items')
      .upsert({ label, position_x: x, position_y: y }, { onConflict: 'label' });
    if (error) throw error;
    return data;
  }
}

export default new ItemRepository();
