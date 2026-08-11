import React, { useState } from 'react';
import Modal from '../../common/Modal';
import ConfirmDialog from '../../common/ConfirmDialog';
import { addMusic } from '../../../api/musicApi';
import { uploadFile } from '../../../api/uploadApi';
import { toast } from 'react-hot-toast';

const MusicPlayerModal = ({ 
  isOpen, onClose, 
  musicList, setMusicList, 
  currentTrack, isPlaying, 
  togglePlayMusic, handleDeleteMusic, 
  user, socket 
}) => {
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicTitle, setMusicTitle] = useState("");
  const [musicAudio, setMusicAudio] = useState(null);
  const [musicCover, setMusicCover] = useState(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [musicToDelete, setMusicToDelete] = useState(null);

  const confirmDeleteMusic = async () => {
    if (!musicToDelete) return;
    await handleDeleteMusic(musicToDelete);
    setMusicToDelete(null);
  };

  const handleMusicSubmit = async (e) => {
    e.preventDefault();
    if (!musicTitle || !musicAudio || !musicCover) {
      toast.error("Vui lòng điền đủ tên bài hát, file nhạc và file ảnh bìa!");
      return;
    }
    
    setIsUploadingFiles(true);
    toast.loading("Đang tải nhạc lên...", { id: 'uploadMusic' });
    try {
      const [audioRes, imageRes] = await Promise.all([
        uploadFile(musicAudio),
        uploadFile(musicCover)
      ]);
      const added = await addMusic(musicTitle, audioRes.url, imageRes.url);
      setMusicList([added, ...musicList]);
      socket.emit('data_changed', { type: 'music', roomId: user.room_id });
      toast.success("Thêm bài hát thành công!", { id: 'uploadMusic' });
      
      setMusicTitle("");
      setMusicAudio(null);
      setMusicCover(null);
      setIsUploadingMusic(false);
    } catch (err) { 
      toast.error("Lỗi upload!", { id: 'uploadMusic' }); 
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleClose = () => {
    onClose();
    setIsUploadingMusic(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🎧 Máy Nghe Nhạc">
      <div className="vinyl-container" style={{ marginBottom: '20px' }}>
        <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}>
          <div className="vinyl-grooves"></div>
          <div className="vinyl-cover" style={{ backgroundImage: `url(${currentTrack?.cover_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop'})` }}></div>
          <div className="vinyl-hole"></div>
        </div>
        <h3 style={{ margin: '15px 0 5px 0', color: '#ff6b81' }}>{currentTrack ? currentTrack.title : 'Chưa có nhạc'}</h3>
        {currentTrack && (
           <button onClick={() => togglePlayMusic(currentTrack)} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: '#ff6b81', color: 'white', cursor: 'pointer', marginTop: '10px' }}>
             {isPlaying ? '⏸ Tạm Dừng' : '▶ Phát'}
           </button>
        )}
      </div>

      {!isUploadingMusic ? (
        <>
          <button onClick={() => setIsUploadingMusic(true)} style={{ width: '100%', padding: '10px', marginBottom: '15px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>➕ Tải Lên Bài Hát Mới</button>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px', padding: '10px 0', maxHeight: '300px', overflowY: 'auto' }}>
            {musicList.map((track) => (
              <div key={track.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <button className="delete-badge" onClick={(e) => { e.stopPropagation(); setMusicToDelete(track.id); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', zIndex: 5, fontSize: '12px' }}>X</button>
                <div 
                  className={`vinyl-record-mini ${currentTrack?.id === track.id && isPlaying ? 'spinning' : ''}`}
                  onClick={() => togglePlayMusic(track)}
                  style={{ width: '80px', height: '80px', background: '#222', borderRadius: '50%', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}
                >
                  <div style={{ width: '90%', height: '90%', borderRadius: '50%', border: '1px solid #333', position: 'absolute' }}></div>
                  <div style={{ width: '80%', height: '80%', borderRadius: '50%', border: '1px solid #444', position: 'absolute' }}></div>
                  <div style={{ width: '70%', height: '70%', borderRadius: '50%', border: '1px solid #555', position: 'absolute' }}></div>
                  
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundImage: `url(${track.cover_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop'})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 2 }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', position: 'absolute', zIndex: 3 }}></div>
                </div>
                <span style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center', color: '#555', fontWeight: currentTrack?.id === track.id ? 'bold' : 'normal' }}>
                  {track.title}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <form onSubmit={handleMusicSubmit} style={{ background: '#fff0f5', padding: '15px', borderRadius: '15px', border: '2px dashed var(--pastel-pink)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#ff6b81' }}>Tải Nhạc Lên</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Tên bài hát:</label>
            <input type="text" value={musicTitle} onChange={e => setMusicTitle(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>File Nhạc (MP3):</label>
            <input type="file" accept="audio/*" onChange={e => setMusicAudio(e.target.files[0])} required style={{ width: '100%', fontSize: '12px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Ảnh Bìa Đĩa (Cover):</label>
            <input type="file" accept="image/*" onChange={e => setMusicCover(e.target.files[0])} required style={{ width: '100%', fontSize: '12px' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={isUploadingFiles} style={{ flex: 1, padding: '10px', background: 'var(--pastel-pink-dark)', color: 'white', border: 'none', borderRadius: '8px', cursor: isUploadingFiles ? 'not-allowed' : 'pointer' }}>
              {isUploadingFiles ? 'Đang tải lên...' : 'Lưu Bài Hát'}
            </button>
            <button type="button" onClick={() => setIsUploadingMusic(false)} disabled={isUploadingFiles} style={{ flex: 1, padding: '10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog 
        isOpen={!!musicToDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa bài nhạc này không?"
        onConfirm={confirmDeleteMusic}
        onCancel={() => setMusicToDelete(null)}
      />
    </Modal>
  );
};

export default MusicPlayerModal;
