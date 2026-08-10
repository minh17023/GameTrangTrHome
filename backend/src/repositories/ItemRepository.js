import { supabase } from '../config/db.js';
import { getRoomId } from '../utils/context.js';

class ItemRepository {
  async getAllItems() {
    const { data, error } = await supabase.from('items').select('*').eq('room_id', getRoomId());
    if (error) throw error;
    return data;
  }

  async updateItemPosition(label, x, y) {
    const { data, error } = await supabase
      .from('items')
      .upsert({ label, position_x: x, position_y: y, room_id: getRoomId() }, { onConflict: 'label,room_id' });
    if (error) throw error;
    return data;
  }
}

export default new ItemRepository();
