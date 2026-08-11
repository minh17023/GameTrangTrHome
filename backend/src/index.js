import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import rootRouter from './routes/index.js';
import { supabase } from './config/db.js';
import MailService from './services/MailService.js';

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

  // Photobooth
  socket.on('photobooth_sync', (data) => {
    const { roomId, count } = data;
    if (roomId) socket.to(roomId).emit('photobooth_countdown', { count });
  });

  socket.on('photobooth_share', (data) => {
    const { roomId, photo, userName } = data;
    if (roomId) socket.to(roomId).emit('photobooth_photo', { photo, userName });
  });

  socket.on('photobooth_call', (data) => {
    const { roomId, offer } = data;
    if (roomId) socket.to(roomId).emit('photobooth_call', data);
  });

  socket.on('photobooth_answer', (data) => {
    const { roomId, answer } = data;
    if (roomId) socket.to(roomId).emit('photobooth_answer', data);
  });

  socket.on('photobooth_ice', (data) => {
    const { roomId, candidate } = data;
    if (roomId) socket.to(roomId).emit('photobooth_ice', data);
  });

  socket.on('photobooth_end', (roomId) => {
    if (roomId) socket.to(roomId).emit('photobooth_end');
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

  // --- HỆ THỐNG NHẮC NHỞ EMAIL TỰ ĐỘNG ---
  if (process.env.GAS_URL) {
    console.log("⏰ Hệ thống nhắc nhở qua Email (GAS) đang chạy...");
    
    // Chạy kiểm tra mỗi 1 giờ
    setInterval(async () => {
      try {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        
        // Tìm các bé chưa được chăm sóc trong 12 tiếng qua
        const { data: pets, error } = await supabase
          .from('pets')
          .select('*')
          .lt('last_interacted_at', twelveHoursAgo);
          
        if (error || !pets) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        for (const pet of pets) {
          const accessories = pet.accessories || [];
          const reminderKey = `email_reminder_${today}`;
          
          if (accessories.includes(reminderKey)) continue; // Đã gửi hôm nay rồi
          
          // Lấy thông tin 2 người dùng trong phòng
          const { data: users } = await supabase
            .from('users')
            .select('email, display_name')
            .eq('room_id', pet.room_id);
            
          if (users && users.length > 0) {
            const emails = users.map(u => u.email).join(', ');
            
            const subject = `🚨 Bé ${pet.name} đang đói meo râu kìa!`;
            const html = `
                <div style="font-family: sans-serif; text-align: center; padding: 20px; background: #fff0f5; border-radius: 15px;">
                  <h2 style="color: #ff6b81;">Meo meo! 😿</h2>
                  <p>Đã nửa ngày rồi hai bạn chưa vào chơi với bé <b>${pet.name}</b> đó.</p>
                  <p>Bé đang rất đói và nhớ hai bạn! Đừng để đứt chuỗi tương tác nhé!</p>
                  <a href="https://hello-kitty-house.onrender.com" style="display: inline-block; padding: 12px 25px; background: #ff4757; color: white; font-weight: bold; text-decoration: none; border-radius: 20px; margin-top: 15px;">Vào thăm bé ngay 🏃‍♂️💨</a>
                </div>
              `;
              
            await MailService.sendEmailViaGas(emails, subject, html);
            
            console.log(`Đã gửi email nhắc nhở chăm sóc bé ${pet.name} tới ${emails}`);
            
            // Đánh dấu đã gửi
            accessories.push(reminderKey);
            await supabase.from('pets').update({ accessories }).eq('id', pet.id);
          }
        }
      } catch (err) {
        console.error("Lỗi khi chạy cron job email:", err.message);
      }
    }, 60 * 60 * 1000); // 1 giờ / lần
  }
});
