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

app.set('io', io);

const onlineUsers = new Map(); // socket.id -> { userId, roomId }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (data) => {
    // data có thể là roomId string (cũ) hoặc object { roomId, userId }
    const roomId = typeof data === 'string' ? data : data.roomId;
    const userId = typeof data === 'string' ? null : data.userId;
    
    if (roomId) {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      if (userId) {
        onlineUsers.set(socket.id, { userId, roomId });
        // Phát sự kiện cho người khác trong phòng biết mình đang online
        socket.to(roomId).emit('user_online', userId);
        
        // Trả về danh sách những người đang online trong phòng này (ngoại trừ mình)
        const roomUsers = Array.from(onlineUsers.values())
          .filter(u => u.roomId === roomId && u.userId !== userId)
          .map(u => u.userId);
        
        socket.emit('room_online_users', roomUsers);
      }
    }
  });

  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${socket.id} joined personal room user_${userId}`);
    }
  });

  socket.on('item_dragging', (data) => {
    const { label, x, y, roomId } = data;
    if (roomId) socket.to(roomId).emit('item_moved', data);
  });

  socket.on('data_changed', (data) => {
    const { type, roomId } = data;
    if (roomId) socket.to(roomId).emit('data_changed', data);
  });

  socket.on('music_action', (data) => {
    const { roomId } = data;
    if (roomId) socket.to(roomId).emit('music_action', data);
  });

  socket.on('watch_movie', (data) => {
    const { roomId } = data;
    if (roomId) socket.to(roomId).emit('watch_movie', data);
  });

  socket.on('sync_tv_state', (data) => {
    const { roomId } = data;
    if (roomId) socket.to(roomId).emit('sync_tv_state', data);
  });

  socket.on('sync_video', (data) => {
    const { roomId } = data;
    if (roomId) socket.to(roomId).emit('sync_video', data);
  });

  // WebRTC Signaling
  socket.on('call_user', (data) => {
    const { roomId, callerId, offer, isVideo } = data;
    if (roomId) socket.to(roomId).emit('call_incoming', { callerId, offer, isVideo });
  });

  socket.on('answer_call', (data) => {
    const { roomId, answer } = data;
    if (roomId) socket.to(roomId).emit('call_answered', { answer });
  });

  socket.on('ice_candidate', (data) => {
    const { roomId, candidate } = data;
    if (roomId) socket.to(roomId).emit('ice_candidate', { candidate });
  });

  socket.on('end_call', (roomId) => {
    if (roomId) socket.to(roomId).emit('call_ended');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      onlineUsers.delete(socket.id);
      
      // Kiểm tra xem user này còn tab/socket nào khác đang mở không
      const hasOtherSockets = Array.from(onlineUsers.values()).some(
        u => u.roomId === userData.roomId && u.userId === userData.userId
      );
      
      if (!hasOtherSockets) {
        socket.to(userData.roomId).emit('user_offline', userData.userId);
      }
    }
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
