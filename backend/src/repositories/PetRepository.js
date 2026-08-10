import { supabase } from '../config/db.js';

class PetRepository {
  async getPetByRoom(roomId) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(error.message);
    }
    return data; // null if not found
  }

  async adoptPet(roomId, type, name) {
    const { data, error } = await supabase
      .from('pets')
      .insert([{ room_id: roomId, type, name, level: 1, exp: 0, streak: 0, accessories: [] }])
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  }

  async updatePet(id, updates) {
    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

export default new PetRepository();
