import React, { useState } from 'react';
import Modal from '../../common/Modal';
import { createPhoto, toggleFavoritePhoto } from '../../../api/photoApi';
import { uploadFile } from '../../../api/uploadApi';
import { toast } from 'react-hot-toast';

const PhotoAlbumModal = ({ isOpen, onClose, photos, setPhotos, setIsStarrySpaceOpen, user, socket }) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState('normal'); // 'normal' | 'ptb'

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const res = await uploadFile(file);
      if (res.url) {
        const added = await createPhoto(res.url);
        setPhotos([added, ...photos]);
        socket.emit('data_changed', { type: 'photo', roomId: user?.room_id });
      }
    } catch (err) {
      toast.error('Lỗi tải ảnh lên');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleToggleFavoritePhoto = async (id) => {
    try {
      const updated = await toggleFavoritePhoto(id);
      setPhotos(photos.map(p => p.id === id ? updated : p));
      socket.emit('data_changed', { type: 'photo', roomId: user?.room_id });
    } catch (err) {}
  };

  const handleClose = () => {
    onClose();
    setSelectedPhoto(null);
  };

  const normalPhotos = photos.filter(p => !p.url.includes('/ptb_'));
  const ptbPhotos = photos.filter(p => p.url.includes('/ptb_'));
  
  const displayPhotos = activeTab === 'normal' ? normalPhotos : ptbPhotos;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🖼️ Album Tình Yêu" width="800px">
      {selectedPhoto ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <button 
            onClick={() => setSelectedPhoto(null)} 
            style={{ position: 'absolute', top: 0, left: 0, padding: '8px 15px', background: '#ccc', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ⬅ Quay lại
          </button>
          <img 
            src={selectedPhoto.url} 
            alt="Ảnh phóng to" 
            style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}
          />
          <button 
            onClick={() => handleToggleFavoritePhoto(selectedPhoto.id)}
            style={{ marginTop: '15px', padding: '10px 20px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
          >
            {selectedPhoto.is_favorite ? '❤️ Bỏ Thích' : '🤍 Yêu Thích'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', borderBottom: '2px solid #eee', marginBottom: '15px' }}>
             <button 
                onClick={() => setActiveTab('normal')}
                style={{ background: 'none', border: 'none', padding: '10px 20px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'normal' ? '3px solid #ff69b4' : '3px solid transparent', color: activeTab === 'normal' ? '#ff69b4' : '#666' }}
             >
                📷 Kỷ Niệm
             </button>
             <button 
                onClick={() => setActiveTab('ptb')}
                style={{ background: 'none', border: 'none', padding: '10px 20px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'ptb' ? '3px solid #ff69b4' : '3px solid transparent', color: activeTab === 'ptb' ? '#ff69b4' : '#666' }}
             >
                📸 Ảnh Photobooth
             </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            {activeTab === 'normal' ? (
              <label style={{ padding: '10px 15px', background: 'var(--pastel-pink)', color: '#000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isUploadingPhoto ? 'Đang tải...' : '➕ Thêm Ảnh'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadPhoto} disabled={isUploadingPhoto} />
              </label>
            ) : (
              <div style={{ fontStyle: 'italic', color: '#888', alignSelf: 'center' }}>Những tấm ảnh được chụp và lưu từ máy Photobooth.</div>
            )}
            
            <button 
              onClick={() => { handleClose(); setIsStarrySpaceOpen(true); }}
              style={{ padding: '10px 15px', background: '#000', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🌌 Không Gian
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', maxHeight: '55vh', overflowY: 'auto', padding: '10px' }}>
            {displayPhotos.length === 0 ? <p style={{textAlign: 'center', color: '#999', gridColumn: '1 / -1'}}>Chưa có bức ảnh nào...</p> : displayPhotos.map(photo => (
              <div 
                key={photo.id} 
                style={{ position: 'relative', width: '100%', paddingBottom: '100%', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img 
                  src={photo.url} 
                  alt="Kỷ niệm" 
                  onClick={() => setSelectedPhoto(photo)}
                  style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} 
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggleFavoritePhoto(photo.id); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: photo.is_favorite ? 'red' : '#999', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                >
                  {photo.is_favorite ? '❤️' : '🤍'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
};

export default PhotoAlbumModal;
