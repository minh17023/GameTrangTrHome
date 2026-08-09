import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
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

// Setup Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('item_dragging', (data) => {
    // data: { label: "Tủ Lạnh", x: 100, y: 200 }
    // Phát tọa độ cho TẤT CẢ client khác TRỪ client đang gửi
    socket.broadcast.emit('item_moved', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, async () => {
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
