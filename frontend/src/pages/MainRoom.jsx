import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import DraggableItem from '../components/common/DraggableItem';
import Messenger from '../components/room/Messenger';
import StarrySpace from '../components/room/StarrySpace';
import { socket } from '../utils/socket';
import { toast } from 'react-hot-toast';
import '../assets/css/index.css';

// API Imports for initial fetching
import { getLetters } from '../api/letterApi';
import { getFridgeItems } from '../api/fridgeApi';
import { getMovies } from '../api/movieApi';
import { getMusic, deleteMusic } from '../api/musicApi';
import { getAllItems } from '../api/itemApi';
import { getPartner } from '../api/authApi';
import { getPhotos } from '../api/photoApi';
import { getPet } from '../api/petApi';

// Features (Modals)
import ProfileModal from '../components/room/features/ProfileModal';
import LetterBoxModal from '../components/room/features/LetterBoxModal';
import FridgeModal from '../components/room/features/FridgeModal';
import MovieModal from '../components/room/features/MovieModal';
import MusicPlayerModal from '../components/room/features/MusicPlayerModal';
import PhotoAlbumModal from '../components/room/features/PhotoAlbumModal';
import TVModal from '../components/room/features/TVModal';
import PetModal from '../components/room/features/PetModal';
import PhotoboothModal from '../components/room/features/PhotoboothModal';
import { soundFx } from '../utils/audioUtils';

const MainRoom = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentFloor, setCurrentFloor] = useState('living');
  const [activeModal, setActiveModal] = useState(null);
  
  const [itemPositions, setItemPositions] = useState({});

  // Shared Data States
  const [letters, setLetters] = useState([]);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [movies, setMovies] = useState([]);
  const [musicList, setMusicList] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [partner, setPartner] = useState(null);
  const [pet, setPet] = useState(null);
  const [petSpeech, setPetSpeech] = useState("");
  const [petFloor, setPetFloor] = useState('living');

  // Specific States
  const [isStarrySpaceOpen, setIsStarrySpaceOpen] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isMessengerMinimized, setIsMessengerMinimized] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef(null);
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
      if (data.type === 'music') {
        getMusic().then(setMusicList);
        toast('Nửa kia vừa cập nhật danh sách Nhạc! 🎧', { icon: '🧑‍🤝‍🧑' });
      }
      if (data.type === 'photo') {
        getPhotos().then(setPhotos);
        toast('Nửa kia vừa cập nhật Album Tình Yêu! 📷', { icon: '🧑‍🤝‍🧑' });
      }
      if (data.type === 'letter' || data.type === 'letter_read') {
        getLetters().then(setLetters);
        if (data.type === 'letter') {
          toast('Bạn có thư mới từ người ấy! 💌', { icon: '🧑‍🤝‍🧑', duration: 5000 });
        }
      }
      if (data.type === 'photobooth_invite') {
        toast('Người yêu đang rủ bạn chụp chung Photobooth! Hãy mở Máy Ảnh lên!', { icon: '📸', duration: 10000 });
      }
      if (data.type === 'pet_floor_changed') {
        setPetFloor(data.floor);
      }
      if (data.type === 'pet_interact') {
        let text = "";
        if (data.action === 'feed') text = "Măm măm... ngon quá! 🍖";
        if (data.action === 'play') text = "Meo meo... vui quá! 🧶";
        if (data.action === 'pet') text = "Meo~ Thích quá đi! 🥰";
        
        setPetSpeech(text);
        if (window.petSpeechTimer) clearTimeout(window.petSpeechTimer);
        window.petSpeechTimer = setTimeout(() => setPetSpeech(""), 3000);
      }
    };

    const handleWatchMovie = (data) => {
      toast(`Nửa kia đang xem phim: ${data.movieTitle}! Hãy mở Tivi lên xem cùng! 🍿`, { 
        icon: '📺', duration: 8000 
      });
    };

    const handleSyncTvState = (data) => {
      if (data.action === 'open') {
        setActiveModal('Tivi');
      } else if (data.action === 'close') {
        setActiveModal(null);
      }
    };

    const handleChatMessage = (msg) => {
      if (msg.sender_id !== user?.id) {
        toast('Nửa kia vừa nhắn tin cho bạn! 💬', { icon: '📱', duration: 4000 });
      }
    };

    const handlePetFloorChanged = (data) => {
      setPetFloor(data.floor);
    };

    const handleItemMoved = (data) => {
      setItemPositions(prev => ({
        ...prev,
        [data.label]: { x: data.x, y: data.y }
      }));
    };

    const handlePetUpdated = (updatedPet) => {
      setPet(updatedPet);
    };

    const handlePetInteracted = (data) => {
      setPet(data.pet);
      if (data.senderId === user.id) return;

      let actionName = 'vừa tương tác với bé';
      if (data.action === 'feed') {
        actionName = 'vừa cho bé ăn 🍖';
        soundFx.playFeed();
      }
      if (data.action === 'play') {
        actionName = 'vừa chơi đùa với bé 🧶';
        soundFx.playPlay();
      }
      if (data.action === 'pet') {
        actionName = 'vừa vuốt ve bé 🥰';
        if (data.pet?.type === 'dog') soundFx.playBark();
        else soundFx.playMeow();
        setTimeout(() => soundFx.playPet(), 500);
      }
      if (data.action === 'sleep') {
        actionName = 'vừa cho bé đi ngủ 🌙';
        soundFx.playSleep();
      }
      if (data.action === 'wake') {
        actionName = 'vừa đánh thức bé ☀️';
        soundFx.playWake();
      }
      toast(`Nửa kia ${actionName}!`, { icon: '🐾' });
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
    socket.on('watch_movie', handleWatchMovie);
    socket.on('sync_tv_state', handleSyncTvState);
    socket.on('chat_message', handleChatMessage);
    socket.on('pet_updated', handlePetUpdated);
    socket.on('pet_interacted', handlePetInteracted);
    socket.on('item_dragging', handleItemMoved);
    socket.on('item_moved', handleItemMoved);
    socket.on('room_online_users', handleRoomOnlineUsers);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    
    return () => {
      socket.off('data_changed', handleDataChanged);
      socket.off('music_action', handleMusicAction);
      socket.off('watch_movie', handleWatchMovie);
      socket.off('sync_tv_state', handleSyncTvState);
      socket.off('chat_message', handleChatMessage);
      socket.off('pet_updated', handlePetUpdated);
      socket.off('pet_interacted', handlePetInteracted);
      socket.off('item_dragging', handleItemMoved);
      socket.off('item_moved', handleItemMoved);
      socket.off('new_pair_request');
      socket.off('pair_accepted');
      socket.off('room_online_users', handleRoomOnlineUsers);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.disconnect();
    };
  }, [user?.id, user?.room_id]);

  // Pet hunger notification check
  useEffect(() => {
    if (!pet) return;

    const checkHunger = () => {
      const today = new Date().toISOString().split('T')[0];
      const hasBeenFedToday = pet.accessories?.some(a => a.endsWith(`_feed_${today}`));
      
      if (!hasBeenFedToday) {
        toast('Meo meo! Bé đang đói bụng kìa, nhớ cho bé ăn nha! 😿🍖', {
          icon: '🚨',
          duration: 6000,
          style: { border: '2px solid #ff7675', padding: '16px' }
        });
      }
    };

    // Check once per session/day on load
    const lastCheck = sessionStorage.getItem('last_hunger_check');
    const today = new Date().toISOString().split('T')[0];
    if (lastCheck !== today) {
      setTimeout(checkHunger, 3000); // Show notification 3s after load
      sessionStorage.setItem('last_hunger_check', today);
    }

    // Also check every 1 hour if tab is left open
    const interval = setInterval(() => {
      const currentToday = new Date().toISOString().split('T')[0];
      const hasBeenFedToday = pet.accessories?.some(a => a.endsWith(`_feed_${currentToday}`));
      if (!hasBeenFedToday) {
        toast('Đã lâu rồi bé chưa được ăn! Nhớ cho bé ăn nhé! 😿🍖', {
          icon: '⏰',
          duration: 6000,
          style: { border: '2px solid #ff7675', padding: '16px' }
        });
      }
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, [pet]);

  const fetchAllData = async () => {
    try {
      const [fetchedLetters, fridge, movieList, music, itemsData, partnerData, fetchedPhotos, fetchedPet] = await Promise.all([
        getLetters().catch(() => []),
        getFridgeItems().catch(() => []),
        getMovies().catch(() => []),
        getMusic().catch(() => []),
        getAllItems().catch(() => []),
        getPartner().catch(() => null),
        getPhotos().catch(() => []),
        getPet().catch(() => null)
      ]);

      if (fetchedLetters) setLetters(fetchedLetters);
      if (fetchedPhotos) setPhotos(fetchedPhotos);
      if (fridge) setFridgeItems(fridge);
      if (movieList) setMovies(movieList);
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
      if (fetchedPet) setPet(fetchedPet);
      
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

  const getBackgroundImage = () => {
    if (currentFloor === 'living') return "url('/living_room.jpg')";
    if (currentFloor === 'bedroom') return "url('/bedroom.jpg')";
    if (currentFloor === 'rooftop') return "url('/rooftop.jpg')";
    return "none";
  };

  const handlePetAction = () => {
    if (!pet) return;
    
    // Play sound
    const audioUrl = pet.type === 'cat' 
      ? 'https://actions.google.com/sounds/v1/animals/cat_meow_2.ogg' 
      : 'https://actions.google.com/sounds/v1/animals/dog_barking.ogg';
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.log("Audio play prevented", e));
    
    // Show speech bubble
    const messages = pet.type === 'cat' 
      ? ["Meow~", "Purrr...", "Meo meo!", "Niao~"] 
      : ["Gâu gâu!", "Woof~", "Ư ử...", "Gâu!"];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setPetSpeech(randomMsg);
    
    setTimeout(() => {
      setPetSpeech("");
    }, 3000);
  };

  const petIcon = (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      {petSpeech && (
        <div style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          background: 'white', border: '2px solid #ffb6c1', borderRadius: '15px', padding: '5px 10px',
          fontSize: '0.9rem', fontWeight: 'bold', color: '#ff6b81', whiteSpace: 'nowrap',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 20
        }}>
          {petSpeech}
          <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '10px', height: '10px', background: 'white', borderBottom: '2px solid #ffb6c1', borderRight: '2px solid #ffb6c1' }}></div>
        </div>
      )}
      <span style={{ fontSize: '4rem', pointerEvents: 'none' }}>
        {pet ? (pet.type === 'cat' ? '🐱' : '🐶') : '🐾'}
      </span>
    </div>
  );

  const handleFloorChange = (floor) => {
    setCurrentFloor(floor);
    setPetFloor(floor);
    socket.emit('data_changed', { type: 'pet_floor_changed', floor, roomId: user.room_id });
  };

  const handleLocalItemMoved = (label, x, y) => {
    setItemPositions(prev => ({
      ...prev,
      [label]: { x, y }
    }));
  };

  return (
    <div className="static-house-wrapper" style={{ backgroundImage: getBackgroundImage() }}>
      
      {/* Profile Button */}
      <button 
        onClick={() => setActiveModal("Profile")} 
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'rgba(255, 255, 255, 0.8)', border: 'none', padding: '10px 20px',
          borderRadius: '20px', fontWeight: 'bold', color: '#ff6b81', cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000
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


      
      {/* Living Room Items */}
      {currentFloor === 'living' && (
        <>
          <DraggableItem icon="📺" label="Tivi" initialX={200} initialY={400} dbPosition={itemPositions["Tivi"]} onClick={() => { setActiveModal("Tivi"); socket.emit('sync_tv_state', { roomId: user.room_id, action: 'open' }); }} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
          <DraggableItem icon="🧊" label="Tủ Lạnh" initialX={800} initialY={200} dbPosition={itemPositions["Tủ Lạnh"]} onClick={() => setActiveModal("Tủ Lạnh")} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
          <DraggableItem icon="📱" label="Điện Thoại" initialX={700} initialY={500} dbPosition={itemPositions["Điện Thoại"]} onClick={() => setActiveModal("Điện Thoại")} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
          <DraggableItem icon="📸" label="Photobooth" initialX={100} initialY={200} dbPosition={itemPositions["Photobooth"]} onClick={() => setActiveModal("Photobooth")} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
        </>
      )}

      {/* Bedroom Items */}
      {currentFloor === 'bedroom' && (
        <>
          <DraggableItem icon="💌" label="Hòm Thư" initialX={400} initialY={500} dbPosition={itemPositions["Hòm Thư"]} onClick={() => setActiveModal("Thư")} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
          <DraggableItem icon="🎧" label="Máy Nghe Nhạc" initialX={700} initialY={600} dbPosition={itemPositions["Máy Nghe Nhạc"]} onClick={() => setActiveModal("Máy Nghe Nhạc")} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
          <DraggableItem icon="🖼️" label="Máy Ảnh" initialX={550} initialY={400} dbPosition={itemPositions["Máy Ảnh"]} onClick={() => setActiveModal("Máy Ảnh")} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
        </>
      )}

      {/* Rooftop Items */}
      {currentFloor === 'rooftop' && (
        <>
          <DraggableItem icon="🎟️" label="Vé Xem Phim" initialX={400} initialY={350} dbPosition={itemPositions["Vé Xem Phim"]} onClick={() => setActiveModal("Vé Xem Phim")} onPositionChange={handleLocalItemMoved} roomId={user.room_id} />
        </>
      )}

      {/* Floor Selector */}
      <div className="floor-selector">
        <button className={`floor-btn ${currentFloor === 'living' ? 'active' : ''}`} onClick={() => handleFloorChange('living')}>Tầng Khách 🛋️</button>
        <button className={`floor-btn ${currentFloor === 'bedroom' ? 'active' : ''}`} onClick={() => handleFloorChange('bedroom')}>Tầng Ngủ 🛏️</button>
        <button className={`floor-btn ${currentFloor === 'rooftop' ? 'active' : ''}`} onClick={() => handleFloorChange('rooftop')}>Tầng Thượng 🌌</button>
      </div>

      {/* Global Items (Render only if pet is on this floor) */}
      {currentFloor === petFloor && (
        <DraggableItem 
          id="Thú Cưng"
          icon={petIcon} 
          label={pet ? pet.name : 'Thú Cưng'} 
          initialX={600} initialY={400} 
          dbPosition={itemPositions["Thú Cưng"]} 
          onClick={() => { setActiveModal("Thú Cưng"); handlePetAction(); }} 
          onDragStart={handlePetAction}
          onPositionChange={handleLocalItemMoved}
          roomId={user.room_id} 
        />
      )}

      {/* Extracted Modals */}
      <ProfileModal 
        isOpen={activeModal === "Profile"} 
        onClose={() => setActiveModal(null)} 
        user={user} 
        partner={partner} 
        isPartnerOnline={isPartnerOnline} 
        setUser={setUser} 
        logout={logout} 
        navigate={navigate} 
      />

      <LetterBoxModal 
        isOpen={activeModal === "Thư"} 
        onClose={() => setActiveModal(null)} 
        letters={letters} 
        setLetters={setLetters} 
        user={user} 
        partner={partner} 
        socket={socket} 
      />

      <FridgeModal 
        isOpen={activeModal === "Tủ Lạnh"} 
        onClose={() => setActiveModal(null)} 
        fridgeItems={fridgeItems} 
        setFridgeItems={setFridgeItems} 
        user={user} 
        socket={socket} 
      />

      <MovieModal 
        isOpen={activeModal === "Vé Xem Phim"} 
        onClose={() => setActiveModal(null)} 
        movies={movies} 
        setMovies={setMovies} 
        user={user} 
        socket={socket} 
      />

      <MusicPlayerModal 
        isOpen={activeModal === "Máy Nghe Nhạc"} 
        onClose={() => setActiveModal(null)} 
        musicList={musicList} 
        setMusicList={setMusicList} 
        currentTrack={currentTrack} 
        isPlaying={isPlaying} 
        togglePlayMusic={togglePlayMusic} 
        handleDeleteMusic={handleDeleteMusic} 
        user={user} 
        socket={socket} 
      />

      <PhotoAlbumModal 
        isOpen={activeModal === "Máy Ảnh"} 
        onClose={() => setActiveModal(null)} 
        photos={photos} 
        setPhotos={setPhotos} 
        setIsStarrySpaceOpen={setIsStarrySpaceOpen}
        user={user} 
        socket={socket} 
      />

      <TVModal 
        isOpen={activeModal === "Tivi"} 
        onClose={() => setActiveModal(null)} 
        user={user} 
        socket={socket} 
      />

      <PhotoboothModal 
        isOpen={activeModal === "Photobooth"} 
        onClose={() => setActiveModal(null)} 
        user={user} 
        socket={socket} 
      />

      <PetModal 
        isOpen={activeModal === "Thú Cưng"} 
        onClose={() => setActiveModal(null)} 
        user={user} 
        socket={socket} 
        pet={pet}
        setPet={setPet}
      />

      {/* Điện Thoại / Messenger (Not a standard modal) */}
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
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white'
            }}
            title="Mở Messenger"
          >
            {!partner?.avatar_url && <span style={{ color: 'white', fontWeight: 'bold' }}>{partner?.display_name?.charAt(0) || '♥'}</span>}
            <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: isPartnerOnline ? '#4cd137' : '#ccc', border: '2px solid white' }}></span>
          </div>
        ) : (
          <div style={{
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, 
            width: '350px', height: '500px', background: 'white', 
            borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column'
          }}>
            <Messenger partner={partner} isOnline={isPartnerOnline} onClose={() => setActiveModal(null)} onMinimize={() => setIsMessengerMinimized(true)} />
          </div>
        )
      )}

      {/* Starry Space */}
      {isStarrySpaceOpen && <StarrySpace photos={photos} onClose={() => setIsStarrySpaceOpen(false)} />}
    </div>
  );
};

export default MainRoom;
