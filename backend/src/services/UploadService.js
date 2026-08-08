import { supabase } from '../config/db.js';
import crypto from 'crypto';

class UploadService {
  async uploadFile(file) {
    if (!file) throw new Error('Không tìm thấy file để upload');

    // Tạo tên file độc nhất để không bị trùng
    const ext = file.originalname.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    // Lấy Public URL
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }
}

export default new UploadService();
