import { supabase } from '../config/db.js';

class AuthRepository {
  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    return data;
  }

  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserByCoupleCode(code) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('couple_code', code)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getPartnerByRoomId(roomId, currentUserId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, couple_code')
      .eq('room_id', roomId)
      .neq('id', currentUserId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateUserRoom(userId, roomId) {
    const { data, error } = await supabase
      .from('users')
      .update({ room_id: roomId })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createRoom() {
    const { data, error } = await supabase
      .from('rooms')
      .insert([{}])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateUser(userId, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('email', email);
    if (error) throw error;
    return data;
  }

  async checkExistingPairRequest(requesterId, targetId) {
    const { data, error } = await supabase
      .from('pair_requests')
      .select('id')
      .eq('requester_id', requesterId)
      .eq('target_id', targetId)
      .eq('status', 'pending')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createPairRequest(requesterId, targetId) {
    const { data, error } = await supabase
      .from('pair_requests')
      .insert([{ requester_id: requesterId, target_id: targetId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getPendingPairRequests(userId) {
    const { data, error } = await supabase
      .from('pair_requests')
      .select('*, requester:requester_id(id, email, display_name, couple_code)')
      .eq('target_id', userId)
      .eq('status', 'pending');
    if (error) throw error;
    return data || [];
  }

  async getPairRequest(requestId) {
    const { data, error } = await supabase
      .from('pair_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    if (error) throw error;
    return data;
  }

  async updatePairRequestStatus(requestId, status) {
    const { data, error } = await supabase
      .from('pair_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteRoomData(roomId) {
    // 1. Set users room_id to null
    await supabase.from('users').update({ room_id: null }).eq('room_id', roomId);

    // 2. Delete room data
    await supabase.from('fridge_items').delete().eq('room_id', roomId);
    await supabase.from('items').delete().eq('room_id', roomId);
    await supabase.from('letters').delete().eq('room_id', roomId);
    await supabase.from('movies').delete().eq('room_id', roomId);
    await supabase.from('music').delete().eq('room_id', roomId);
    await supabase.from('phone_messages').delete().eq('room_id', roomId);

    // 3. Delete room
    await supabase.from('rooms').delete().eq('id', roomId);
  }
}

export default new AuthRepository();
