import React, { useState } from 'react';
import Modal from '../../common/Modal';
import { createLetter, markLetterAsRead } from '../../../api/letterApi';

const LetterBoxModal = ({ isOpen, onClose, letters, setLetters, user, partner, socket }) => {
  const [letterViewMode, setLetterViewMode] = useState('list');
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [newLetterContent, setNewLetterContent] = useState("");

  const handleSendLetter = async () => {
    if (!newLetterContent.trim()) return;
    try { 
      const added = await createLetter(newLetterContent); 
      setLetters([added, ...letters]);
      setNewLetterContent("");
      setLetterViewMode('list');
      socket.emit('data_changed', { type: 'letter', roomId: user?.room_id });
    } catch (err) {}
  };

  const handleOpenLetter = async (letter) => {
    setSelectedLetter(letter);
    setLetterViewMode('view');
    if (letter.sender_id === partner?.id && !letter.is_read) {
      const updated = await markLetterAsRead(letter.id);
      if (updated) {
        setLetters(letters.map(l => l.id === letter.id ? updated : l));
        setSelectedLetter(updated);
        socket.emit('data_changed', { type: 'letter_read', roomId: user?.room_id });
      }
    }
  };

  const handleClose = () => {
    onClose();
    setLetterViewMode('list');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="💌 Hòm Thư">
      {letterViewMode === 'list' && (
        <div>
          <button onClick={() => setLetterViewMode('compose')} style={{ width: '100%', padding: '10px', marginBottom: '15px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>✍️ Soạn Thư Mới</button>
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {letters.length === 0 ? <p style={{textAlign: 'center', color: '#999'}}>Chưa có bức thư nào...</p> : letters.map(letter => (
              <div 
                key={letter.id} 
                onClick={() => handleOpenLetter(letter)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #eee', cursor: 'pointer', background: !letter.is_read && letter.sender_id === partner?.id ? '#fff0f5' : '#fff', fontWeight: !letter.is_read && letter.sender_id === partner?.id ? 'bold' : 'normal' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px' }}>
                  <span>Từ: {letter.sender_id === user?.id ? 'Bạn' : (partner?.display_name || 'Nửa kia')}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(letter.created_at).toLocaleDateString('vi-VN')}</span>
                    {letter.sender_id === user?.id && (
                      <span style={{ fontSize: '0.7rem', color: letter.is_read ? '#4cd137' : '#999', marginTop: '2px' }}>
                        {letter.is_read ? 'Đã xem' : 'Chưa xem'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {letter.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {letterViewMode === 'compose' && (
        <div>
          <textarea 
            value={newLetterContent}
            onChange={(e) => setNewLetterContent(e.target.value)}
            placeholder="Viết gì đó cho người ấy nha..."
            style={{ width: '100%', height: '200px', padding: '10px', borderRadius: '15px', border: '2px solid var(--pastel-pink)', resize: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <button onClick={() => setLetterViewMode('list')} style={{ padding: '8px 15px', background: '#ccc', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>Quay lại</button>
            <button onClick={handleSendLetter} style={{ padding: '8px 20px', background: 'var(--pastel-pink-dark)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Gửi Thư</button>
          </div>
        </div>
      )}

      {letterViewMode === 'view' && selectedLetter && (
        <div>
          <div style={{ padding: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '10px', minHeight: '150px', whiteSpace: 'pre-wrap' }}>
            {selectedLetter.content}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px', textAlign: 'right' }}>
            {selectedLetter.sender_id === user?.id ? (
              <span>Gửi lúc: {new Date(selectedLetter.created_at).toLocaleString('vi-VN')} • <b style={{ color: selectedLetter.is_read ? '#4cd137' : '#999' }}>{selectedLetter.is_read ? 'Đã xem' : 'Chưa xem'}</b></span>
            ) : (
              <span>Nhận lúc: {new Date(selectedLetter.created_at).toLocaleString('vi-VN')}</span>
            )}
          </div>
          <div style={{ marginTop: '15px' }}>
            <button onClick={() => setLetterViewMode('list')} style={{ padding: '8px 15px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>Quay lại</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LetterBoxModal;
