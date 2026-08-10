import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AuthRepository from '../repositories/AuthRepository.js';
import MailService from './MailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hello-kitty-super-secret-key-123';

// In-memory store for OTP requests (Email -> { code, expires, password, displayName })
const otpStore = new Map();
// In-memory store for Reset requests (Email -> { code, expires })
const resetStore = new Map();

class AuthService {
  async sendOTPRequest(email, password, displayName, gender = 'Nữ') {
    if (!email || !password || !displayName) {
      throw new Error('Vui lòng điền đủ thông tin');
    }

    const existingUser = await AuthRepository.getUserByEmail(email);
    if (existingUser && existingUser.is_verified !== false) {
      throw new Error('Email này đã được sử dụng');
    }

    // Generate OTP
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 5 * 60000); // 5 mins

    otpStore.set(email, {
      code: otp_code,
      expires: otp_expires,
      password,
      displayName,
      gender
    });

    // Send OTP email
    await MailService.sendOTP(email, otp_code);

    return { message: 'Vui lòng kiểm tra email để lấy mã xác nhận' };
  }

  async verifyOTPAndRegister(email, code) {
    if (!email || !code) throw new Error('Vui lòng nhập đủ thông tin');
    
    const otpData = otpStore.get(email);
    if (!otpData) throw new Error('Không tìm thấy yêu cầu đăng ký cho email này');
    if (otpData.code !== code) throw new Error('Mã xác nhận không đúng');
    if (new Date() > otpData.expires) {
      otpStore.delete(email);
      throw new Error('Mã xác nhận đã hết hạn. Vui lòng gửi lại');
    }

    // If verified, proceed to save in DB
    const password_hash = await bcrypt.hash(otpData.password, 10);
    const couple_code = crypto.randomBytes(3).toString('hex').toUpperCase();

    // If there is an existing unverified user, we can just update it, or better yet, since we use email as unique, we should upsert or delete the old one.
    // AuthRepository.createUser will fail if email already exists. We should delete existing unverified first.
    const existingUser = await AuthRepository.getUserByEmail(email);
    if (existingUser && !existingUser.is_verified) {
      await AuthRepository.deleteUserByEmail(email);
    }

    const newUser = await AuthRepository.createUser({
      email,
      password_hash,
      display_name: otpData.displayName,
      gender: otpData.gender,
      couple_code,
      is_verified: true
    });

    otpStore.delete(email);

    return this.generateAuthResponse(newUser);
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
      throw new Error('Tài khoản chưa được xác thực. Vui lòng đăng ký lại để xác thực.');
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

    return { message: 'Đã gửi lời mời ghép đôi. Đang chờ xác nhận!', targetId: partner.id };
  }

  async getPairRequests(currentUser) {
    return await AuthRepository.getPendingPairRequests(currentUser.id);
  }

  async acceptPairRequest(currentUser, requestId) {
    const request = await AuthRepository.getPairRequest(requestId);
    if (!request || request.target_id !== currentUser.id || request.status !== 'pending') {
      throw new Error('Lời mời không hợp lệ');
    }

    // Fetch requester properly
    const requesterData = await AuthRepository.getUserById(request.requester_id);

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
    return { ...this.generateAuthResponse(updatedUser), requesterId: request.requester_id, roomId };
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
        gender: user.gender,
        couple_code: user.couple_code,
        room_id: user.room_id
      }
    };
  }

  async sendPasswordResetOTP(email) {
    if (!email) throw new Error('Vui lòng nhập email');

    const user = await AuthRepository.getUserByEmail(email);
    if (!user) throw new Error('Không tìm thấy tài khoản với email này');
    if (!user.is_verified) throw new Error('Tài khoản này chưa được xác thực');

    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 5 * 60000); // 5 mins

    resetStore.set(email, {
      code: otp_code,
      expires: otp_expires
    });

    await MailService.sendPasswordReset(email, otp_code);
    return { message: 'Đã gửi mã khôi phục mật khẩu. Vui lòng kiểm tra email.' };
  }

  async resetPassword(email, code, newPassword) {
    if (!email || !code || !newPassword) throw new Error('Vui lòng nhập đủ thông tin');

    const resetData = resetStore.get(email);
    if (!resetData) throw new Error('Không có yêu cầu khôi phục mật khẩu cho email này');
    if (resetData.code !== code) throw new Error('Mã xác nhận không đúng');
    if (new Date() > resetData.expires) {
      resetStore.delete(email);
      throw new Error('Mã xác nhận đã hết hạn. Vui lòng gửi lại');
    }

    const user = await AuthRepository.getUserByEmail(email);
    if (!user) throw new Error('Không tìm thấy tài khoản');

    const password_hash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await AuthRepository.updateUser(user.id, { password_hash });

    resetStore.delete(email);

    return { message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }
}

export default new AuthService();
