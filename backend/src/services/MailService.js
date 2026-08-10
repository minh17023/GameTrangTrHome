import nodemailer from 'nodemailer';

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendOTP(email, otpCode) {
    const mailOptions = {
      from: 'Hello Kitty House <minh17022k4@gmail.com>',
      to: email,
      subject: 'Mã xác nhận Đăng ký Ngôi Nhà Hello Kitty',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #ff6b81; padding: 20px;">
          <h2>Xin chào! 💖</h2>
          <p>Mã xác nhận đăng ký tài khoản của bạn là:</p>
          <h1 style="background: #ffd1dc; display: inline-block; padding: 10px 20px; border-radius: 10px; color: #ff6b81;">${otpCode}</h1>
          <p>Mã này có hiệu lực trong vòng 5 phút.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi gửi mail OTP:', error);
      throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại.');
    }
  }

  async sendPairSuccess(email, partnerName) {
    const mailOptions = {
      from: 'Hello Kitty House <minh17022k4@gmail.com>',
      to: email,
      subject: 'Ghép đôi thành công! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #ff6b81; padding: 20px;">
          <h2>Chúc mừng! 💞</h2>
          <p>Bạn và <strong>${partnerName}</strong> đã chính thức chung nhà.</p>
          <p>Hãy cùng nhau tạo nên những kỷ niệm thật đẹp nhé!</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi gửi mail chúc mừng:', error);
    }
  }

  async sendPasswordReset(email, otpCode) {
    const mailOptions = {
      from: 'Hello Kitty House <minh17022k4@gmail.com>',
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #ff6b81; padding: 20px;">
          <h2>Lấy lại chìa khóa 🗝️</h2>
          <p>Mã xác nhận để đặt lại mật khẩu của bạn là:</p>
          <h1 style="background: #ffd1dc; display: inline-block; padding: 10px 20px; border-radius: 10px; color: #ff6b81;">${otpCode}</h1>
          <p>Mã này có hiệu lực trong vòng 5 phút. Đừng chia sẻ mã này cho ai nhé!</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi gửi mail reset mật khẩu:', error);
      throw new Error('Không thể gửi email. Vui lòng thử lại.');
    }
  }
}

export default new MailService();
