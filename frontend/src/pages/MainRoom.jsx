import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import DraggableItem from '../components/common/DraggableItem';
import Modal from '../components/common/Modal';
import HelloKittyNPC from '../components/room/HelloKittyNPC';
import { getLetters, createLetter, markLetterAsRead } from '../api/letterApi';
import { getFridgeItems, addFridgeItem, updateFridgeItem, deleteFridgeItem } from '../api/fridgeApi';
import { getMovies, addMovie, updateMovie, deleteMovie } from '../api/movieApi';
import { getPhoneMessages, addPhoneMessage, updatePhoneMessage, deletePhoneMessage } from '../api/phoneApi';
import { getMusic, addMusic, updateMusic, deleteMusic } from '../api/musicApi';
import { uploadFile } from '../api/uploadApi';
import { getAllItems } from '../api/itemApi';
import { getPartner, updateProfile } from '../api/authApi';
import Messenger from '../components/room/Messenger';
import { socket } from '../utils/socket';
import { toast } from 'react-hot-toast';
import '../assets/css/index.css';

const MainRoom = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentFloor, setCurrentFloor] = useState('living');
  const [activeModal, setActiveModal] = useState(null);
  
  const [letterContent, setLetterContent] = useState("");
  const [npcTarget, setNpcTarget] = useState(null);

  // States
  const [fridgeItems, setFridgeItems] = useState([]);
  const [newFood, setNewFood] = useState("");

  const [movies, setMovies] = useState([]);
  const [isMovieFormOpen, setIsMovieFormOpen] = useState(false);
  const [movieForm, setMovieForm] = useState({ id: null, title: '', date: '', time: '' });
  
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [musicList, setMusicList] = useState([]);
  
  const [itemPositions, setItemPositions] = useState({});
  
  // Music Player State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const [letters, setLetters] = useState([]);
  const [letterViewMode, setLetterViewMode] = useState('list');
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [newLetterContent, setNewLetterContent] = useState("");

  // Music Form State
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicTitle, setMusicTitle] = useState("");
  const [musicAudio, setMusicAudio] = useState(null);
  const [musicCover, setMusicCover] = useState(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Profile State
  const [partner, setPartner] = useState(null);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.display_name || '');
  const [editGender, setEditGender] = useState(user?.gender || 'Nữ');
  const [editAvatar, setEditAvatar] = useState(null);
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isMessengerMinimized, setIsMessengerMinimized] = useState(false);
  const initialLoadRef = useRef(true);
  
  const isPartnerOnline = partner && onlineUserIds.includes(partner.id);

  useEffect(() => {
    if (initialLoadRef.current) {
      if (partner) initialLoadRef.current = false;
      return;
    }
    if (partner) {
      if (isPartnerOnline) {
        toast(`${partner.display_name} vừa vào nhà! 🟢`, { icon: '👋' });
      } else {
        toast(`${partner.display_name} đã rời đi! ⚪`, { icon: '🏃' });
      }
    }
  }, [isPartnerOnline, partner]);

  useEffect(() => {
    if (!user || !user.room_id) {
      navigate('/profile');
      return;
    }

    fetchAllData();
    
    // Khởi động kết nối Socket.IO
    socket.connect();
    if (user?.room_id) {
      socket.emit('join_room', { roomId: user.room_id, userId: user.id });
    }
    if (user?.id) {
      socket.emit('join_user_room', user.id);
    }
    
    // Online tracking
    const handleRoomOnlineUsers = (users) => {
      setOnlineUserIds(users);
    };
    const handleUserOnline = (userId) => {
      setOnlineUserIds(prev => [...prev, userId]);
    };
    const handleUserOffline = (userId) => {
      setOnlineUserIds(prev => prev.filter(id => id !== userId));
    };

    const handleDataChanged = (data) => {
      if (data.type === 'fridge') {
        getFridgeItems().then(setFridgeItems);
        toast('Nửa kia vừa cập nhật Tủ lạnh! 🧊', { icon: '🧑‍🤝‍🧑' });
      }
      if (data.type === 'movie') {
        getMovies().then(setMovies);
        toast('Nửa kia vừa cập nhật Vé Xem Phim! 🎟️', { icon: '🧑‍🤝‍🧑' });
      }
      if (data.type === 'phone') {
        getPhoneMessages().then(setVoiceMessages);
        toast('Nửa kia vừa gửi Lời nhắn mới! 📱', { icon: '🧑‍🤝‍🧑' });
      }
      if (data.type === 'music') {
        getMusic().then(setMusicList);
        toast('Nửa kia vừa cập nhật danh sách Nhạc! 🎧', { icon: '🧑‍🤝‍🧑' });
      }
      if (data.type === 'letter' || data.type === 'letter_read') {
        getLetters().then(setLetters);
        if (data.type === 'letter') {
          toast('Bạn có thư mới từ người ấy! 💌', { icon: '🧑‍🤝‍🧑', duration: 5000 });
        }
      }
    };

    const handleMusicAction = (data) => {
      if (data.action === 'play') {
        setCurrentTrack(data.track);
        setIsPlaying(true);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = data.track.url;
            audioRef.current.play();
          }
        }, 100);
      } else if (data.action === 'pause') {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    socket.on('data_changed', handleDataChanged);
    socket.on('music_action', handleMusicAction);
    socket.on('room_online_users', handleRoomOnlineUsers);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    
    return () => {
      socket.off('data_changed', handleDataChanged);
      socket.off('music_action', handleMusicAction);
      socket.off('new_pair_request');
      socket.off('pair_accepted');
      socket.off('room_online_users', handleRoomOnlineUsers);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.disconnect();
    };
  }, [user?.id, user?.room_id]);

  const fetchAllData = async () => {
    try {
      const [fetchedLetters, fridge, movieList, phone, music, itemsData, partnerData] = await Promise.all([
        getLetters().catch(() => []),
        getFridgeItems().catch(() => []),
        getMovies().catch(() => []),
        getPhoneMessages().catch(() => []),
        getMusic().catch(() => []),
        getAllItems().catch(() => []),
        getPartner().catch(() => null)
      ]);

      if (fetchedLetters) setLetters(fetchedLetters);
      if (fridge) setFridgeItems(fridge);
      if (movieList) setMovies(movieList);
      if (phone) setVoiceMessages(phone);
      if (music) {
        setMusicList(music);
        // Autoplay bài hát đầu tiên khi vừa vào phòng
        if (music.length > 0) {
          setCurrentTrack(music[0]);
          setIsPlaying(true);
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch((err) => {
                console.log("Trình duyệt chặn Autoplay:", err);
                setIsPlaying(false);
              });
            }
          }, 500);
        }
      }
      if (partnerData) setPartner(partnerData);
      
      if (itemsData && Array.isArray(itemsData)) {
        const positions = {};
        itemsData.forEach(item => {
          positions[item.label] = { x: item.position_x, y: item.position_y };
        });
        setItemPositions(positions);
      }
    } catch (err) {
      console.log("Error loading data", err);
    }
  };

  // ---- LETTER ----
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

  // ---- FRIDGE ----
  const handleAddFood = async () => {
    if (!newFood.trim()) return;
    try {
      const added = await addFridgeItem(newFood);
      if (added) {
        setFridgeItems([...fridgeItems, added]);
        socket.emit('data_changed', { type: 'fridge', roomId: user.room_id });
      }
      setNewFood("");
    } catch (err) {}
  };
  const handleEditFood = async (item) => {
    const newName = prompt("Nhập tên món ăn mới:", item.name);
    if (newName && newName.trim() !== "") {
      const updated = await updateFridgeItem(item.id, newName);
      setFridgeItems(fridgeItems.map(f => f.id === item.id ? updated : f));
      socket.emit('data_changed', { type: 'fridge', roomId: user.room_id });
    }
  };
  const handleDeleteFood = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa món này?")) {
      await deleteFridgeItem(id);
      setFridgeItems(fridgeItems.filter(f => f.id !== id));
      socket.emit('data_changed', { type: 'fridge', roomId: user.room_id });
    }
  };

  // ---- MOVIE ----
  const handleOpenMovieForm = (movie = null) => {
    if (movie) {
      setMovieForm(movie);
    } else {
      setMovieForm({ id: null, title: '', date: '', time: '' });
    }
    setIsMovieFormOpen(true);
  };

  const handleSaveMovie = async () => {
    const { id, title, date, time } = movieForm;
    if (!title || !date || !time) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    try {
      if (id) {
        const updated = await updateMovie(id, title, time, date);
        setMovies(movies.map(m => m.id === id ? updated : m));
      } else {
        const added = await addMovie(title, time, date);
        if (added) setMovies([added, ...movies]);
      }
      setIsMovieFormOpen(false);
      socket.emit('data_changed', { type: 'movie', roomId: user.room_id });
    } catch (err) {}
  };
  const handleDeleteMovie = async (id) => {
    if (window.confirm("Xóa vé phim này?")) {
      await deleteMovie(id);
      setMovies(movies.filter(m => m.id !== id));
      socket.emit('data_changed', { type: 'movie', roomId: user.room_id });
    }
  };

  // ---- PHONE ----
  const handleAddPhone = async () => {
    const title = prompt("Tiêu đề tin nhắn:");
    if (!title) return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        toast.loading("Đang tải file lên, vui lòng đợi...", { id: 'uploadPhone' });
        try {
          const res = await uploadFile(file);
          const added = await addPhoneMessage(title, res.url);
          setVoiceMessages([added, ...voiceMessages]);
          socket.emit('data_changed', { type: 'phone', roomId: user.room_id });
          toast.success("Thêm tin nhắn thành công!", { id: 'uploadPhone' });
        } catch (err) { 
          toast.error("Lỗi tải lên!", { id: 'uploadPhone' }); 
        }
      }
    };
    fileInput.click();
  };
  const handleEditPhone = async (item) => {
    const title = prompt("Tiêu đề mới:", item.title);
    if (title) {
      const updated = await updatePhoneMessage(item.id, title, item.audio_url);
      setVoiceMessages(voiceMessages.map(m => m.id === item.id ? updated : m));
      socket.emit('data_changed', { type: 'phone', roomId: user.room_id });
    }
  };
  const handleDeletePhone = async (id) => {
    if (window.confirm("Xóa lời nhắn này?")) {
      await deletePhoneMessage(id);
      setVoiceMessages(voiceMessages.filter(m => m.id !== id));
      socket.emit('data_changed', { type: 'phone', roomId: user.room_id });
    }
  };

  // ---- MUSIC ----
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
      // Reset form
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

  const handleDeleteMusic = async (id) => {
    if (window.confirm("Xóa bài nhạc này?")) {
      await deleteMusic(id);
      setMusicList(musicList.filter(m => m.id !== id));
      socket.emit('data_changed', { type: 'music', roomId: user.room_id });
      if (currentTrack?.id === id) {
        setCurrentTrack(null);
        setIsPlaying(false);
        socket.emit('music_action', { action: 'pause', roomId: user.room_id });
      }
    }
  };

  const togglePlayMusic = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        socket.emit('music_action', { action: 'pause', roomId: user.room_id });
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        socket.emit('music_action', { action: 'play', track, roomId: user.room_id });
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) audioRef.current.play();
        socket.emit('music_action', { action: 'play', track, roomId: user.room_id });
      }, 100);
    }
  };

  const getBackgroundImage = () => {
    if (currentFloor === 'living') return "url('/living_room.jpg')";
    if (currentFloor === 'bedroom') return "url('/bedroom.jpg')";
    if (currentFloor === 'rooftop') return "url('/rooftop.jpg')";
    return "none";
  };

  return (
    <div className="static-house-wrapper" style={{ backgroundImage: getBackgroundImage() }}>
      
      {/* Profile Button */}
      <button 
        onClick={() => setActiveModal("Profile")} 
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.8)',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '20px',
          fontWeight: 'bold',
          color: '#ff6b81',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}
      >
        🧑‍🤝‍🧑 Thông tin
      </button>
      
      {currentTrack && (
        <audio 
          ref={audioRef} 
          src={currentTrack.url} 
          loop 
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        ></audio>
      )}

      <HelloKittyNPC targetObject={npcTarget} onTargetReached={() => setNpcTarget(null)} />
      
      {/* Living Room Items */}
      {currentFloor === 'living' && (
        <>
          <DraggableItem icon="🧊" label="Tủ Lạnh" initialX={800} initialY={200} dbPosition={itemPositions["Tủ Lạnh"]} onClick={() => setActiveModal("Tủ Lạnh")} roomId={user.room_id} />
          <DraggableItem icon="📱" label="Điện Thoại" initialX={700} initialY={500} dbPosition={itemPositions["Điện Thoại"]} onClick={() => setActiveModal("Điện Thoại")} roomId={user.room_id} />
          <DraggableItem icon="🐱" label="Bé Mèo" initialX={450} initialY={600} dbPosition={itemPositions["Bé Mèo"]} onClick={() => alert("Meow~")} roomId={user.room_id} />
        </>
      )}

      {/* Bedroom Items */}
      {currentFloor === 'bedroom' && (
        <>
          <DraggableItem icon="💌" label="Hòm Thư" initialX={400} initialY={500} dbPosition={itemPositions["Hòm Thư"]} onClick={() => setActiveModal("Thư")} roomId={user.room_id} />
          <DraggableItem icon="🎧" label="Máy Nghe Nhạc" initialX={700} initialY={600} dbPosition={itemPositions["Máy Nghe Nhạc"]} onClick={() => setActiveModal("Máy Nghe Nhạc")} roomId={user.room_id} />
        </>
      )}

      {/* Rooftop Items */}
      {currentFloor === 'rooftop' && (
        <>
          <DraggableItem icon="🎟️" label="Vé Xem Phim" initialX={400} initialY={350} dbPosition={itemPositions["Vé Xem Phim"]} onClick={() => setActiveModal("Vé Xem Phim")} roomId={user.room_id} />
        </>
      )}

      {/* Floor Selector */}
      <div className="floor-selector">
        <button className={`floor-btn ${currentFloor === 'living' ? 'active' : ''}`} onClick={() => setCurrentFloor('living')}>Tầng Khách 🛋️</button>
        <button className={`floor-btn ${currentFloor === 'bedroom' ? 'active' : ''}`} onClick={() => setCurrentFloor('bedroom')}>Tầng Ngủ 🛏️</button>
        <button className={`floor-btn ${currentFloor === 'rooftop' ? 'active' : ''}`} onClick={() => setCurrentFloor('rooftop')}>Tầng Thượng 🌌</button>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === "Profile"} onClose={() => setActiveModal(null)} title="🧑‍🤝‍🧑 Thông tin ghép đôi">
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
              <h4 style={{ margin: '0 0 5px 0', color: '#ff6b81' }}>💖 Bạn ({user.gender || 'Nữ'})</h4>
              <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Tên:</strong> {user.display_name}</p>
              <p style={{ margin: '2px 0', fontSize: '0.9rem' }}><strong>Mã:</strong> <span style={{ background: 'white', padding: '2px 6px', borderRadius: '5px' }}>{user.couple_code}</span></p>
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

      <Modal isOpen={activeModal === "Thư"} onClose={() => { setActiveModal(null); setLetterViewMode('list'); }} title="💌 Hòm Thư">
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

      <Modal isOpen={activeModal === "Tủ Lạnh"} onClose={() => setActiveModal(null)} title="🧊 Hôm nay ăn gì?">
        <div>
          {fridgeItems.map((item, index) => (
            <span key={index} className="fridge-item">
              {item.name}
              <button className="action-btn" onClick={() => handleEditFood(item)}>✏️</button>
              <button className="action-btn" onClick={() => handleDeleteFood(item.id)}>❌</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <input type="text" placeholder="Thêm món mới..." value={newFood} onChange={(e) => setNewFood(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddFood()} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', flex: 1 }} />
          <button onClick={handleAddFood} style={{ padding: '8px 15px', background: 'var(--pastel-pink-dark)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Thêm</button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "Vé Xem Phim"} onClose={() => { setActiveModal(null); setIsMovieFormOpen(false); }} title="🎟️ Lịch sử Vé Xem Phim">
        {!isMovieFormOpen ? (
          <>
            <button onClick={() => handleOpenMovieForm()} style={{ width: '100%', padding: '10px', marginBottom: '15px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>➕ Thêm Vé Mới</button>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {movies.map((movie, idx) => (
                <div key={idx} className="movie-ticket" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>{movie.title}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>🕒 {movie.time} - 📅 {movie.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button className="action-btn" onClick={() => handleOpenMovieForm(movie)}>✏️</button>
                    <button className="action-btn" onClick={() => handleDeleteMovie(movie.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Tên phim" 
              value={movieForm.title} 
              onChange={(e) => setMovieForm({...movieForm, title: e.target.value})}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <input 
              type="text" 
              placeholder="Ngày xem (VD: 14/02/2026)" 
              value={movieForm.date} 
              onChange={(e) => setMovieForm({...movieForm, date: e.target.value})}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <input 
              type="text" 
              placeholder="Giờ chiếu (VD: 20:00)" 
              value={movieForm.time} 
              onChange={(e) => setMovieForm({...movieForm, time: e.target.value})}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <button onClick={() => setIsMovieFormOpen(false)} style={{ padding: '10px 15px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleSaveMovie} style={{ padding: '10px 20px', background: 'var(--pastel-pink-dark)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu Vé</button>
            </div>
          </div>
        )}
      </Modal>

      {activeModal === "Điện Thoại" && (
        isMessengerMinimized ? (
          <div 
            onClick={() => setIsMessengerMinimized(false)}
            style={{
              position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, 
              width: '60px', height: '60px', borderRadius: '50%', 
              background: '#ffb6c1',
              backgroundImage: partner?.avatar_url ? `url(${partner.avatar_url})` : 'none', 
              backgroundSize: 'cover', backgroundPosition: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid white'
            }}
            title="Mở Messenger"
          >
            {!partner?.avatar_url && <span style={{ color: 'white', fontWeight: 'bold' }}>{partner?.display_name?.charAt(0) || '♥'}</span>}
            <span style={{ 
              position: 'absolute', bottom: '2px', right: '2px', 
              width: '14px', height: '14px', borderRadius: '50%', 
              background: isPartnerOnline ? '#4cd137' : '#ccc',
              border: '2px solid white'
            }}></span>
          </div>
        ) : (
          <div style={{
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, 
            width: '350px', height: '500px', background: 'white', 
            borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column'
          }}>
            <Messenger partner={partner} isOnline={isPartnerOnline} onClose={() => setActiveModal(null)} onMinimize={() => setIsMessengerMinimized(true)} />
          </div>
        )
      )}

      <Modal isOpen={activeModal === "Máy Nghe Nhạc"} onClose={() => setActiveModal(null)} title="🎧 Máy Nghe Nhạc">
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
                  <button className="delete-badge" onClick={(e) => { e.stopPropagation(); handleDeleteMusic(track.id); }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', zIndex: 5, fontSize: '12px' }}>X</button>
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
      </Modal>

    </div>
  );
};

export default MainRoom;
