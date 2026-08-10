import React from 'react';
import Modal from './Modal';

const GuideModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📖 Hướng Dẫn Sử Dụng">
      <div style={{ padding: '10px', maxHeight: '60vh', overflowY: 'auto', lineHeight: '1.6', color: '#333' }}>
        <h3 style={{ color: '#ff6b81', marginTop: 0 }}>🏠 Chào mừng đến với Ngôi Nhà Chung!</h3>
        <p>Đây là không gian riêng tư của hai bạn. Mọi thao tác trong nhà đều được <strong>đồng bộ theo thời gian thực</strong> (realtime). Khi bạn tương tác với một đồ vật, nửa kia cũng sẽ thấy điều tương tự ngay lập tức!</p>
        
        <h4 style={{ color: '#ffb6c1', borderBottom: '2px solid #fff0f5', paddingBottom: '5px' }}>📺 Rạp Phim Tại Gia (Tivi)</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Chứa danh sách các bộ phim điện ảnh bom tấn liên tục được cập nhật.</li>
          <li>Khi bạn chọn một phim, nửa kia sẽ nhận được thông báo để vào xem cùng.</li>
          <li>Thao tác Mở/Đóng tivi và chọn phim được đồng bộ trực tiếp.</li>
        </ul>

        <h4 style={{ color: '#ffb6c1', borderBottom: '2px solid #fff0f5', paddingBottom: '5px' }}>🎧 Máy Nghe Nhạc (Đĩa than)</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Bạn có thể tải lên các bài hát yêu thích (file MP3) kèm theo ảnh bìa.</li>
          <li>Nhạc sẽ phát chung trong phòng. Khi bạn Play/Pause, nhạc bên máy nửa kia cũng sẽ Play/Pause tương ứng.</li>
        </ul>

        <h4 style={{ color: '#ffb6c1', borderBottom: '2px solid #fff0f5', paddingBottom: '5px' }}>🧊 Tủ Lạnh Ẩm Thực</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Nơi lưu trữ các món ăn yêu thích của hai người.</li>
          <li>Bạn có thể thả tim ❤️ cho những món ăn bạn thích để nhắc khéo nửa kia.</li>
        </ul>

        <h4 style={{ color: '#ffb6c1', borderBottom: '2px solid #fff0f5', paddingBottom: '5px' }}>📷 Album Tình Yêu & Không Gian Xoay</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Lưu giữ những kỷ niệm đẹp bằng cách tải ảnh lên.</li>
          <li>Bạn có thể ấn nút <strong>"🌌 Không Gian"</strong> để vào chế độ không gian các vì sao 3D tuyệt đẹp chứa ảnh của hai bạn.</li>
        </ul>

        <h4 style={{ color: '#ffb6c1', borderBottom: '2px solid #fff0f5', paddingBottom: '5px' }}>💌 Hòm Thư Tình (Mailbox)</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Viết và gửi những bức thư tay lãng mạn cho nhau.</li>
          <li>Hệ thống hiển thị trạng thái "Chưa đọc" / "Đã đọc" để bạn biết nửa kia đã nhận được tâm tư của mình chưa.</li>
        </ul>

        <h4 style={{ color: '#ffb6c1', borderBottom: '2px solid #fff0f5', paddingBottom: '5px' }}>📱 Điện Thoại (Messenger)</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Nơi hai bạn nhắn tin trò chuyện với nhau.</li>
          <li>Hỗ trợ tính năng gọi Video / Audio qua công nghệ WebRTC siêu nét.</li>
        </ul>

        <h4 style={{ color: '#ffb6c1', borderBottom: '2px solid #fff0f5', paddingBottom: '5px' }}>✨ Kéo Thả Tự Do</h4>
        <p>Bạn có thể nhấn giữ và kéo thả bất kỳ đồ vật nào trong nhà (Tivi, Tủ Lạnh, Bé Mèo...) để trang trí lại căn phòng theo ý thích. Vị trí sẽ được lưu lại và đồng bộ cho cả hai!</p>
        
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '10px', background: '#fff0f5', borderRadius: '10px' }}>
          <strong>Chúc hai bạn có những giây phút ngọt ngào! 💞</strong>
        </div>
      </div>
    </Modal>
  );
};

export default GuideModal;
