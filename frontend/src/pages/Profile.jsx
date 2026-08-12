import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { getPairRequests, acceptPairRequest, updateProfile } from '../api/authApi';
import { uploadFile } from '../api/uploadApi';
import { API_URL } from '../api/apiClient';
import { socket } from '../utils/socket';
import { toast } from 'react-hot-toast';
import GuideModal from '../components/common/GuideModal';

const Profile = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const [partnerCode, setPartnerCode] = useState('');
  const [requests, setRequests] = useState([]);
  
  // States for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.display_name || '');
  const [editGender, setEditGender] = useState(user?.gender || 'Nữ');
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  
  // State cho Modal Hướng Dẫn
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.room_id) {
      loadRequests();
      
      // Connect to personal socket room for realtime updates
      socket.connect();
      
      const joinUserRoom = () => {
        socket.emit('join_user_room', user.id);
      };

      if (socket.connected) {
        joinUserRoom();
      }
      socket.on('connect', joinUserRoom);

      socket.on('new_pair_request', () => {
        loadRequests(); // Tự động reload danh sách khi có lời mời mới
      });

      socket.on('pair_accepted', (data) => {
        // Nếu người kia đồng ý, cập nhật thông tin user ngay lập tức
        setUser({ ...user, room_id: data.roomId });
      });

      return () => {
        socket.off('connect', joinUserRoom);
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const data = await updateProfile({ displayName: editName, gender: editGender, avatarUrl: editAvatar });
      setUser(data.user);
      toast.success('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Lỗi cập nhật hồ sơ');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffe4e1' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
          <div 
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: '#ffb6c1', 
              backgroundImage: user?.avatar_url ? `url(${user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px',
              border: '4px solid #ffd1dc'
            }}
          >
            {!user?.avatar_url && (user?.display_name ? user.display_name.charAt(0).toUpperCase() : '♥')}
          </div>
          <h2 style={{ color: '#ff6b81', fontFamily: 'Quicksand', margin: 0 }}>Xin chào, {user?.display_name}! 🎀</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            style={{ background: 'transparent', border: '1px solid #ffb6c1', color: '#ff6b81', borderRadius: '20px', padding: '5px 15px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            {isEditing ? 'Hủy sửa' : '✏️ Sửa hồ sơ'}
          </button>
        </div>

        {isEditing && (
          <form onSubmit={handleUpdateProfile} style={{ background: '#fff0f5', padding: '20px', borderRadius: '15px', marginTop: '20px', border: '1px solid #ffd1dc', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.9rem', color: '#ff6b81', fontWeight: 'bold' }}>Tên hiển thị:</label>
            <input 
              type="text" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              required 
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ffb6c1' }}
            />
            
            <label style={{ fontSize: '0.9rem', color: '#ff6b81', fontWeight: 'bold' }}>Giới tính:</label>
            <select 
              value={editGender} 
              onChange={e => setEditGender(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ffb6c1', background: 'white' }}
            >
              <option value="Nữ">Nữ 👧</option>
              <option value="Nam">Nam 👦</option>
              <option value="Khác">Khác 🌈</option>
            </select>

            <label style={{ fontSize: '0.9rem', color: '#ff6b81', fontWeight: 'bold' }}>Ảnh đại diện:</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  setIsUploading(true);
                  toast.loading("Đang tải ảnh...", { id: 'uploadAvatar' });
                  try {
                    const res = await uploadFile(file);
                    setEditAvatar(res.url);
                    toast.success("Tải ảnh thành công!", { id: 'uploadAvatar' });
                  } catch (err) {
                    toast.error("Lỗi tải ảnh!", { id: 'uploadAvatar' });
                  } finally {
                    setIsUploading(false);
                  }
                }
              }}
              style={{ fontSize: '0.8rem' }}
              disabled={isUploading}
            />

            <button type="submit" disabled={isUploading} style={{ background: '#ff6b81', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: isUploading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
              Lưu thay đổi
            </button>
          </form>
        )}
        
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

        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => setIsGuideOpen(true)}
            style={{ padding: '8px 20px', background: '#ffe4e1', border: '1px solid #ffb6c1', color: '#ff6b81', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📖 Hướng Dẫn Sử Dụng
          </button>
          <a href="#" onClick={handleLogout} style={{ color: '#aaa', textDecoration: 'underline', fontSize: '0.9rem' }}>Đăng xuất</a>
        </div>
      </div>
      
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

export default Profile;
