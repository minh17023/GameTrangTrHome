import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rootRouter from './routes/index.js';
import { supabase } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Sử dụng Root Router mới
app.use('/api', rootRouter);

app.get('/', (req, res) => {
  res.send('Hello Kitty Backend API is running!');
});

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Kiểm tra kết nối Supabase
  try {
    const { error } = await supabase.from('letters').select('id').limit(1);
    
    // PGRST204 or 42P01 means table does not exist. 
    // If we get this error, it means the connection and authentication SUCCEEDED!
    if (error && error.code !== '42P01' && error.code !== 'PGRST204') { 
      console.warn("⚠️ Lỗi Supabase:", error.message);
    } else {
      console.log(`✅ Kết nối Database Supabase thành công! (${process.env.SUPABASE_URL})`);
      if (error && (error.code === '42P01' || error.code === 'PGRST204')) {
        console.log("   (Lưu ý: Bảng 'letters' chưa được tạo trong database, bạn nhớ tạo nhé)");
      }
    }
  } catch (err) {
    console.error("❌ Không thể kết nối Database:", err.message);
  }
});
