import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API_URL } from '../api/apiClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      login(res.data.user, res.data.token);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi đăng nhập');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffe4e1' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '350px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#ff6b81', fontFamily: 'Quicksand' }}>Đăng Nhập 💕</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          Chưa có chìa khóa? <Link to="/register" style={{ color: '#ff6b81', fontWeight: 'bold' }}>Tạo ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
