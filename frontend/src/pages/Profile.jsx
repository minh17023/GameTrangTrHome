import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { getPairRequests, acceptPairRequest } from '../api/authApi';
import { API_URL } from '../api/apiClient';
import { socket } from '../utils/socket';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const [partnerCode, setPartnerCode] = useState('');
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.room_id) {
      loadRequests();
      
      // Connect to personal socket room for realtime updates
      socket.connect();
      socket.emit('join_user_room', user.id);

      socket.on('new_pair_request', () => {
        loadRequests(); // Tự động reload danh sách khi có lời mời mới
      });

      socket.on('pair_accepted', (data) => {
        // Nếu người kia đồng ý, cập nhật thông tin user ngay lập tức
        setUser({ ...user, room_id: data.roomId });
      });

      return () => {
        socket.off('new_pair_request');
        socket.off('pair_accepted');
      };
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      const data = await getPairRequests();
      setRequests(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách lời mời", err);
    }
  };

  const handlePair = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/pair`, { partnerCode });
      toast.success(res.data.message || 'Đã gửi lời mời thành công!');
      setPartnerCode('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi gửi yêu cầu');
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const data = await acceptPairRequest(requestId);
      toast.success('Ghép đôi thành công! Hãy vào không gian chung ngay nào.');
      setUser(data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi chấp nhận lời mời');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffe4e1' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ color: '#ff6b81', fontFamily: 'Quicksand' }}>Xin chào, {user?.display_name}! 🎀</h2>
        
        <div style={{ margin: '20px 0', padding: '15px', background: '#fdfd96', borderRadius: '15px' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Mã ghép đôi của bạn:</p>
          <h1 style={{ margin: 0, letterSpacing: '3px', color: '#ff6b81' }}>{user?.couple_code}</h1>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>Gửi mã này cho nửa kia để kết nối nhé!</p>
        </div>

        {!user?.room_id ? (
          <>
            {/* Form gửi lời mời */}
            <form onSubmit={handlePair} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#ff6b81' }}>Hoặc nhập mã của nửa kia:</p>
              <input 
                type="text" 
                placeholder="Nhập mã 6 ký tự..." 
                value={partnerCode} 
                onChange={e => setPartnerCode(e.target.value.toUpperCase())} 
                style={{ padding: '10px', borderRadius: '10px', border: '2px solid #ffb6c1', textAlign: 'center', fontSize: '1.2rem', textTransform: 'uppercase' }} 
                required
                maxLength={6}
              />
              <button type="submit" style={{ background: '#ff6b81', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(255, 107, 129, 0.3)' }}>
                💞 Gửi Lời Mời Ghép Đôi
              </button>
            </form>

            {/* Danh sách lời mời */}
            {requests.length > 0 && (
              <div style={{ marginTop: '30px', textAlign: 'left' }}>
                <h4 style={{ color: '#ff6b81', margin: '0 0 10px 0' }}>💌 Lời mời dành cho bạn:</h4>
                {requests.map(req => (
                  <div key={req.id} style={{ background: '#fff0f5', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', border: '1px solid #ffd1dc' }}>
                    <div>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{req.requester.display_name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{req.requester.email}</p>
                    </div>
                    <button onClick={() => handleAccept(req.id)} style={{ background: '#ff6b81', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Đồng ý
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ margin: '30px 0', padding: '15px', background: '#aec6cf', borderRadius: '15px', color: 'white' }}>
            <h3 style={{ margin: 0 }}>Đã ghép đôi thành công! 🎉</h3>
            <p style={{ fontSize: '0.9rem' }}>Bạn và nửa kia đã có chung một không gian.</p>
            <button onClick={() => navigate('/')} style={{ marginTop: '10px', background: 'white', color: '#aec6cf', padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Vào Nhà Thôi
            </button>
          </div>
        )}

        <button onClick={handleLogout} style={{ marginTop: '20px', background: 'transparent', color: '#999', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Profile;
