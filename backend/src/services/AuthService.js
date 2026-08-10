import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AuthRepository from '../repositories/AuthRepository.js';
import MailService from './MailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hello-kitty-super-secret-key-123';

class AuthService {
  async register(email, password, displayName) {
    if (!email || !password || !displayName) {
      throw new Error('Vui lòng điền đủ thông tin');
    }

    const existingUser = await AuthRepository.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email này đã được sử dụng');
    }

    const password_hash = await bcrypt.hash(password, 10);
    // Generate a cute random couple code
    const couple_code = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Generate OTP
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 5 * 60000).toISOString(); // 5 mins

    const newUser = await AuthRepository.createUser({
      email,
      password_hash,
      display_name: displayName,
      couple_code,
      is_verified: false,
      otp_code,
      otp_expires
    });

    // Send OTP email
    await MailService.sendOTP(email, otp_code);

    return { message: 'Vui lòng kiểm tra email để lấy mã xác nhận', email: newUser.email };
  }

  async verifyOTP(email, code) {
    if (!email || !code) throw new Error('Vui lòng nhập đủ thông tin');
    const user = await AuthRepository.getUserByEmail(email);
    
    if (!user) throw new Error('Người dùng không tồn tại');
    if (user.is_verified) throw new Error('Tài khoản đã được xác thực');
    if (user.otp_code !== code) throw new Error('Mã xác nhận không đúng');
    if (new Date() > new Date(user.otp_expires)) throw new Error('Mã xác nhận đã hết hạn');

    const updatedUser = await AuthRepository.updateUser(user.id, {
      is_verified: true,
      otp_code: null,
      otp_expires: null
    });

    return this.generateAuthResponse(updatedUser);
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Vui lòng điền đủ email và mật khẩu');
    }

    const user = await AuthRepository.getUserByEmail(email);
    if (!user) {
      throw new Error('Sai email hoặc mật khẩu');
    }

    if (user.is_verified === false) {
      // Tự động tạo mã mới nếu đăng nhập mà chưa xác thực
      const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_expires = new Date(Date.now() + 5 * 60000).toISOString();
      await AuthRepository.updateUser(user.id, { otp_code, otp_expires });
      await MailService.sendOTP(user.email, otp_code);
      throw new Error('NOT_VERIFIED');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Sai email hoặc mật khẩu');
    }

    return this.generateAuthResponse(user);
  }

  async pairCouple(currentUser, partnerCode) {
    if (!partnerCode) throw new Error('Vui lòng nhập mã ghép đôi');
    if (currentUser.couple_code === partnerCode) {
      throw new Error('Không thể tự ghép đôi với chính mình');
    }

    const partner = await AuthRepository.getUserByCoupleCode(partnerCode);
    if (!partner) {
      throw new Error('Không tìm thấy người dùng với mã này');
    }

    // Instead of joining directly, create a pair request
    await AuthRepository.createPairRequest(currentUser.id, partner.id);

    return { message: 'Đã gửi lời mời ghép đôi. Đang chờ xác nhận!' };
  }

  async getPairRequests(currentUser) {
    return await AuthRepository.getPendingPairRequests(currentUser.id);
  }

  async acceptPairRequest(currentUser, requestId) {
    const request = await AuthRepository.getPairRequest(requestId);
    if (!request || request.target_id !== currentUser.id || request.status !== 'pending') {
      throw new Error('Lời mời không hợp lệ');
    }

    const requester = await AuthRepository.getUserByEmail((await AuthRepository.getUserByCoupleCode((await AuthRepository.getPendingPairRequests(currentUser.id)).find(r => r.id === requestId).requester.couple_code)).email); 
    // Let's refetch requester properly
    const { data: requesterData } = await AuthRepository.supabase.from('users').select('*').eq('id', request.requester_id).single();

    if (!requesterData) throw new Error('Người gửi không tồn tại');

    // Create room and pair them
    let roomId = currentUser.room_id || requesterData.room_id;
    if (!roomId) {
      const newRoom = await AuthRepository.createRoom();
      roomId = newRoom.id;
    }

    await AuthRepository.updateUserRoom(currentUser.id, roomId);
    await AuthRepository.updateUserRoom(requesterData.id, roomId);
    
    // Update request status
    await AuthRepository.updatePairRequestStatus(requestId, 'accepted');

    // Send congratulation emails
    await MailService.sendPairSuccess(currentUser.email, requesterData.display_name);
    await MailService.sendPairSuccess(requesterData.email, currentUser.display_name);

    const updatedUser = { ...currentUser, room_id: roomId };
    return this.generateAuthResponse(updatedUser);
  }

  async getPartner(currentUser) {
    if (!currentUser.room_id) return null;
    return await AuthRepository.getPartnerByRoomId(currentUser.room_id, currentUser.id);
  }

  generateAuthResponse(user) {
    const token = jwt.sign(
      { id: user.id, email: user.email, room_id: user.room_id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        couple_code: user.couple_code,
        room_id: user.room_id
      }
    };
  }
}

export default new AuthService();
