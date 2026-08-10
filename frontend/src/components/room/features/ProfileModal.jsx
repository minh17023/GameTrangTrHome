import React, { useState } from 'react';
import Modal from '../../common/Modal';
import { updateProfile } from '../../../api/authApi';
import { uploadFile } from '../../../api/uploadApi';
import { toast } from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose, user, partner, isPartnerOnline, setUser, logout, navigate }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.display_name || '');
  const [editGender, setEditGender] = useState(user?.gender || 'Nữ');
  const [editAvatar, setEditAvatar] = useState(null);
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const data = await updateProfile({ displayName: editName, gender: editGender, avatarUrl: editAvatar });
      setUser(data.user);
      toast.success('Cập nhật hồ sơ thành công!');
      setIsEditingProfile(false);
    } catch (err) {
      toast.error('Lỗi cập nhật hồ sơ');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧑‍🤝‍🧑 Thông tin ghép đôi">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        
        <div style={{ background: '#fff0f5', padding: '15px', borderRadius: '15px', width: '100%', border: '2px dashed var(--pastel-pink)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div 
            style={{ 
              width: '60px', height: '60px', borderRadius: '50%', background: '#ffb6c1', 
              backgroundImage: user?.avatar_url ? `url(${user.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px', border: '2px solid white'
            }}
          >
            {!user?.avatar_url && (user?.display_name ? user.display_name.charAt(0).toUpperCase() : '♥')}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#ff6b81' }}>💖 Bạn ({user?.gender || 'Nữ'})</h4>
            <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Tên:</strong> {user?.display_name}</p>
            <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Mã:</strong> <span style={{ background: 'white', padding: '2px 6px', borderRadius: '5px' }}>{user?.couple_code}</span></p>
          </div>
          <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ background: 'transparent', border: '1px solid #ffb6c1', color: '#ff6b81', borderRadius: '10px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
            {isEditingProfile ? 'Hủy' : '✏️ Sửa'}
          </button>
        </div>

        {isEditingProfile && (
          <form onSubmit={handleUpdateProfile} style={{ background: '#fdfd96', padding: '15px', borderRadius: '15px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Tên hiển thị:</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
            
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Giới tính:</label>
            <select value={editGender} onChange={e => setEditGender(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}>
              <option value="Nữ">Nữ 👧</option>
              <option value="Nam">Nam 👦</option>
              <option value="Khác">Khác 🌈</option>
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Đổi ảnh đại diện:</label>
            <input type="file" accept="image/*" disabled={isUploadingProfilePic} onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                setIsUploadingProfilePic(true);
                toast.loading("Đang tải ảnh...", { id: 'uploadAvatar' });
                try {
                  const res = await uploadFile(file);
                  setEditAvatar(res.url);
                  toast.success("Tải ảnh thành công!", { id: 'uploadAvatar' });
                } catch (err) { toast.error("Lỗi tải ảnh", { id: 'uploadAvatar' }); }
                finally { setIsUploadingProfilePic(false); }
              }
            }} style={{ fontSize: '0.8rem' }} />

            <button type="submit" disabled={isUploadingProfilePic} style={{ background: '#ff6b81', color: 'white', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Lưu Thay Đổi
            </button>
          </form>
        )}
        
        <div style={{ background: '#fff0f5', padding: '15px', borderRadius: '15px', width: '100%', border: '2px dashed var(--pastel-pink)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div 
            style={{ 
              width: '60px', height: '60px', borderRadius: '50%', background: '#ffb6c1', 
              backgroundImage: partner?.avatar_url ? `url(${partner.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px', border: '2px solid white'
            }}
          >
            {!partner?.avatar_url && (partner?.display_name ? partner.display_name.charAt(0).toUpperCase() : '♥')}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#ff6b81', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💞 Nửa kia {partner?.gender ? `(${partner.gender})` : ''}
              {partner && (
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: isPartnerOnline ? '#4cd137' : '#ccc', display: 'inline-block' }} title={isPartnerOnline ? "Đang online" : "Đang offline"}></span>
              )}
            </h4>
            {partner ? (
              <>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Tên:</strong> {partner.display_name}</p>
                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {partner.email}</p>
              </>
            ) : (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Đang chờ mảnh ghép còn lại...</p>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => {
            logout();
            navigate('/login');
          }}
          style={{
            padding: '10px 20px',
            background: '#ff4757',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Đăng xuất
        </button>
      </div>
    </Modal>
  );
};

export default ProfileModal;
