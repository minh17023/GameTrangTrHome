import jwt from 'jsonwebtoken';
import { supabase } from '../config/db.js';
import { context } from '../utils/context.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hello-kitty-super-secret-key-123';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Không tìm thấy token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Người dùng không tồn tại' });
    }

    req.user = user;
    
    // Lưu roomId vào AsyncLocalStorage để Repositories tự lấy
    context.run({ roomId: user.room_id }, () => {
      next();
    });
  } catch (error) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
