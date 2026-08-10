import { supabase } from '../config/db.js';
import { getRoomId } from '../utils/context.js';

class PhotoRepository {
  async getPhotos() {
    const { data, error } = await supabase.from('photos')
      .select('*')
      .eq('room_id', getRoomId())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createPhoto(url, uploaderId) {
    const { data, error } = await supabase.from('photos')
      .insert([
        { url, room_id: getRoomId(), uploader_id: uploaderId, is_favorite: false }
      ])
      .select();
    if (error) throw error;
    return data[0];
  }

  async toggleFavorite(id) {
    // First, get the current state
    const { data: current, error: getError } = await supabase.from('photos')
      .select('is_favorite')
      .eq('id', id)
      .eq('room_id', getRoomId())
      .single();
    
    if (getError) throw getError;

    const { data, error } = await supabase.from('photos')
      .update({ is_favorite: !current.is_favorite })
      .eq('id', id)
      .eq('room_id', getRoomId())
      .select();
      
    if (error) throw error;
    return data?.[0];
  }

  async deletePhoto(id) {
    const { error } = await supabase.from('photos')
      .delete()
      .eq('id', id)
      .eq('room_id', getRoomId());
    if (error) throw error;
    return true;
  }
}

export default new PhotoRepository();
