import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { verifyOTP } from '../api/authApi';

const Register = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:8080/api/auth/register', { email, password, displayName });
      setMsg(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi đăng ký');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await verifyOTP(email, otpCode);
      login(data.user, data.token);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Mã xác nhận không đúng');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffe4e1' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '350px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#ff6b81', fontFamily: 'Quicksand' }}>{step === 1 ? 'Đăng Ký 💕' : 'Xác nhận Email 💌'}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {msg && <p style={{ color: '#ff6b81' }}>{msg}</p>}

        {step === 1 ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Tên của bạn" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1' }} 
              required
            />
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
              Tiếp tục
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Nhập mã 6 số" 
              value={otpCode} 
              onChange={e => setOtpCode(e.target.value)} 
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid #ffb6c1', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }} 
              maxLength="6"
              required
            />
            <button type="submit" style={{ background: '#ff6b81', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(255, 107, 129, 0.3)' }}>
              Xác nhận
            </button>
            <button type="button" onClick={() => setStep(1)} style={{ background: 'transparent', color: '#ff6b81', padding: '10px', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Quay lại
            </button>
          </form>
        )}

        {step === 1 && (
          <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
            Đã có chìa khóa? <Link to="/login" style={{ color: '#ff6b81', fontWeight: 'bold' }}>Đăng nhập</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
