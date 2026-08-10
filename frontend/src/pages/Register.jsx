import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API_URL } from '../api/apiClient';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('Nữ'); // Thêm state gender, mặc định Nữ
  const [otpCode, setOtpCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!email || !password || !displayName) {
      toast.error('Vui lòng điền đủ Tên, Email và Mật khẩu trước khi gửi mã!');
      return;
    }
    setIsSending(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { email, password, displayName, gender });
      toast.success('Đã gửi mã xác nhận về email của bạn!');
      setCodeSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi gửi mã');
    } finally {
      setIsSending(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!codeSent) {
      toast.error('Vui lòng bấm gửi mã và kiểm tra email trước!');
      return;
    }
    if (!otpCode) {
      toast.error('Vui lòng nhập mã xác nhận!');
      return;
    }
    
    try {
      const data = await verifyOTP(email, otpCode);
      toast.success('Đăng ký thành công!');
      login(data.user, data.token);
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Mã xác nhận không đúng');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffe4e1' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#ff6b81', fontFamily: 'Quicksand' }}>Đăng Ký 💕</h2>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <input 
            type="text" 
            placeholder="Tên của bạn" 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)} 
            style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1' }} 
            required
            disabled={codeSent}
          />
          <select 
            value={gender} 
            onChange={e => setGender(e.target.value)}
            disabled={codeSent}
            style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1', background: 'white', color: '#555' }}
          >
            <option value="Nữ">Nữ 👧</option>
            <option value="Nam">Nam 👦</option>
            <option value="Khác">Khác 🌈</option>
          </select>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1' }} 
            required
            disabled={codeSent}
          />
          <input 
            type="password" 
            placeholder="Mật khẩu" 
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
              onClick={handleSendCode} 
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
            Xác nhận Đăng ký
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          Đã có chìa khóa? <Link to="/login" style={{ color: '#ff6b81', fontWeight: 'bold' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
