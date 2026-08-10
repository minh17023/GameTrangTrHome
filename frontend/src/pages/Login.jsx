import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API_URL } from '../api/apiClient';
import { sendPasswordResetOTP, resetPassword } from '../api/authApi';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      toast.success('Đăng nhập thành công!');
      login(res.data.user, res.data.token);
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi đăng nhập');
    }
  };

  const handleSendResetCode = async () => {
    if (!email) {
      toast.error('Vui lòng nhập Email để lấy lại mật khẩu');
      return;
    }
    setIsSending(true);
    try {
      const data = await sendPasswordResetOTP(email);
      toast.success(data.message);
      setCodeSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi gửi mã');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!codeSent) {
      toast.error('Vui lòng bấm gửi mã trước!');
      return;
    }
    if (!otpCode || !password) {
      toast.error('Vui lòng điền mã xác nhận và mật khẩu mới');
      return;
    }
    try {
      const data = await resetPassword(email, otpCode, password);
      toast.success(data.message);
      // Quay về login
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setOtpCode('');
        setCodeSent(false);
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi đổi mật khẩu');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffe4e1' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        
        {mode === 'login' ? (
          <>
            <h2 style={{ color: '#ff6b81', fontFamily: 'Quicksand' }}>Đăng Nhập 💕</h2>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1' }} 
                required
              />
              <input 
                type="password" 
                placeholder="Mật khẩu" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1' }} 
                required
              />
              <button type="submit" style={{ background: '#ff6b81', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(255, 107, 129, 0.3)' }}>
                Vào nhà thôi!
              </button>
            </form>
            
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
              <button 
                onClick={() => { setMode('forgot'); setPassword(''); }} 
                style={{ background: 'transparent', border: 'none', color: '#ff6b81', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Quên mật khẩu?
              </button>
            </p>
            
            <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
              Chưa có chìa khóa? <Link to="/register" style={{ color: '#ff6b81', fontWeight: 'bold' }}>Tạo ngay</Link>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ color: '#ff6b81', fontFamily: 'Quicksand' }}>Lấy Lại Chìa Khóa 🗝️</h2>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input 
                type="email" 
                placeholder="Email của bạn" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1' }} 
                required
                disabled={codeSent}
              />
              <input 
                type="password" 
                placeholder="Mật khẩu MỚI" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1' }} 
                required
                disabled={codeSent}
              />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Nhập mã 6 số" 
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value)} 
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1', textAlign: 'center', letterSpacing: '2px' }} 
                  maxLength="6"
                />
                <button 
                  type="button" 
                  onClick={handleSendResetCode} 
                  disabled={isSending || codeSent}
                  style={{ 
                    background: codeSent ? '#ccc' : '#ffb6c1', 
                    color: 'white', 
                    padding: '10px 15px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    cursor: (isSending || codeSent) ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isSending ? 'Đang gửi...' : (codeSent ? 'Đã gửi mã' : 'Gửi mã')}
                </button>
              </div>

              <button type="submit" style={{ background: '#ff6b81', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(255, 107, 129, 0.3)', marginTop: '10px' }}>
                Đổi Mật Khẩu
              </button>
            </form>
            
            <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
              <button 
                onClick={() => { setMode('login'); setPassword(''); setCodeSent(false); }} 
                style={{ background: 'transparent', border: 'none', color: '#ff6b81', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Quay lại Đăng nhập
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
