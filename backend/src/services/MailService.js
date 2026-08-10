const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbzT85Mou9FBIVN_2f3Y2rGiTZvBYY-jYZVLF3sk-v8vaGwfEHz13wiooWqU07BDgO0a/exec';

class MailService {
  async sendEmailViaGas(to, subject, html) {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to, subject, html })
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error("Lỗi từ Google Apps Script:", data.error);
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Không thể kết nối đến Google Apps Script:", err);
      throw err;
    }
  }

  async sendOTP(email, otpCode) {
    const subject = 'Mã xác nhận Đăng ký Ngôi Nhà Hello Kitty';
    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #ff6b81; padding: 20px;">
        <h2>Xin chào! 💖</h2>
        <p>Mã xác nhận đăng ký tài khoản của bạn là:</p>
        <h1 style="background: #ffd1dc; display: inline-block; padding: 10px 20px; border-radius: 10px; color: #ff6b81;">${otpCode}</h1>
        <p>Mã này có hiệu lực trong vòng 5 phút.</p>
      </div>
    `;

    try {
      await this.sendEmailViaGas(email, subject, html);
    } catch (error) {
      console.error('Lỗi gửi mail OTP:', error);
      throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại.');
    }
  }

  async sendPairSuccess(email, partnerName) {
    const subject = 'Ghép đôi thành công! 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #ff6b81; padding: 20px;">
        <h2>Chúc mừng! 💞</h2>
        <p>Bạn và <strong>${partnerName}</strong> đã chính thức chung nhà.</p>
        <p>Hãy cùng nhau tạo nên những kỷ niệm thật đẹp nhé!</p>
      </div>
    `;

    try {
      await this.sendEmailViaGas(email, subject, html);
    } catch (error) {
      console.error('Lỗi gửi mail chúc mừng:', error);
    }
  }

  async sendPasswordReset(email, otpCode) {
    const subject = 'Yêu cầu đặt lại mật khẩu';
    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #ff6b81; padding: 20px;">
        <h2>Lấy lại chìa khóa 🗝️</h2>
        <p>Mã xác nhận để đặt lại mật khẩu của bạn là:</p>
        <h1 style="background: #ffd1dc; display: inline-block; padding: 10px 20px; border-radius: 10px; color: #ff6b81;">${otpCode}</h1>
        <p>Mã này có hiệu lực trong vòng 5 phút. Đừng chia sẻ mã này cho ai nhé!</p>
      </div>
    `;

    try {
      await this.sendEmailViaGas(email, subject, html);
    } catch (error) {
      console.error('Lỗi gửi mail reset mật khẩu:', error);
      throw new Error('Không thể gửi email. Vui lòng thử lại.');
    }
  }
}

export default new MailService();
