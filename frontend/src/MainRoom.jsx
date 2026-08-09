import React, { useState, useEffect, useRef } from 'react';
import DraggableItem from './DraggableItem';
import Modal from './Modal';
import HelloKittyNPC from './HelloKittyNPC';
import { getLetter, updateLetter } from './api/letterApi';
import { getFridgeItems, addFridgeItem, updateFridgeItem, deleteFridgeItem } from './api/fridgeApi';
import { getMovies, addMovie, updateMovie, deleteMovie } from './api/movieApi';
import { getPhoneMessages, addPhoneMessage, updatePhoneMessage, deletePhoneMessage } from './api/phoneApi';
import { getMusic, addMusic, updateMusic, deleteMusic } from './api/musicApi';
import { uploadFile } from './api/uploadApi';
import { getAllItems } from './api/itemApi';
import './index.css';

const MainRoom = () => {
  const [currentFloor, setCurrentFloor] = useState('living');
  const [activeModal, setActiveModal] = useState(null);
  
  const [letterContent, setLetterContent] = useState("");
  const [npcTarget, setNpcTarget] = useState(null);

  // States
  const [fridgeItems, setFridgeItems] = useState([]);
  const [newFood, setNewFood] = useState("");

  const [movies, setMovies] = useState([]);
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [musicList, setMusicList] = useState([]);
  
  const [itemPositions, setItemPositions] = useState({});
  
  // Music Player State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [letter, fridge, movieList, phone, music, itemsData] = await Promise.all([
        getLetter().catch(() => null),
        getFridgeItems().catch(() => []),
        getMovies().catch(() => []),
        getPhoneMessages().catch(() => []),
        getMusic().catch(() => []),
        getAllItems().catch(() => [])
      ]);

      if (letter?.content) setLetterContent(letter.content);
      if (fridge) setFridgeItems(fridge);
      if (movieList) setMovies(movieList);
      if (phone) setVoiceMessages(phone);
      if (music) setMusicList(music);
      
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
  const saveLetter = async (content) => {
    setLetterContent(content);
    try { await updateLetter(content); } catch (err) {}
  };

  // ---- FRIDGE ----
  const handleAddFood = async () => {
    if (!newFood.trim()) return;
    try {
      const added = await addFridgeItem(newFood);
      if (added) setFridgeItems([...fridgeItems, added]);
      setNewFood("");
    } catch (err) {}
  };
  const handleEditFood = async (item) => {
    const newName = prompt("Nhập tên món ăn mới:", item.name);
    if (newName && newName.trim() !== "") {
      const updated = await updateFridgeItem(item.id, newName);
      setFridgeItems(fridgeItems.map(f => f.id === item.id ? updated : f));
    }
  };
  const handleDeleteFood = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa món này?")) {
      await deleteFridgeItem(id);
      setFridgeItems(fridgeItems.filter(f => f.id !== id));
    }
  };

  // ---- MOVIE ----
  const handleAddMovie = async () => {
    const title = prompt("Tên phim:");
    if (!title) return;
    const date = prompt("Ngày xem (VD: 14/02/2024):");
    const time = prompt("Giờ chiếu (VD: 20:00):");
    if (title && date && time) {
      const added = await addMovie(title, time, date);
      if (added) setMovies([added, ...movies]);
    }
  };
  const handleEditMovie = async (item) => {
    const title = prompt("Tên phim:", item.title);
    if (!title) return;
    const date = prompt("Ngày xem:", item.date);
    const time = prompt("Giờ chiếu:", item.time);
    if (title && date && time) {
      const updated = await updateMovie(item.id, title, time, date);
      setMovies(movies.map(m => m.id === item.id ? updated : m));
    }
  };
  const handleDeleteMovie = async (id) => {
    if (window.confirm("Xóa vé phim này?")) {
      await deleteMovie(id);
      setMovies(movies.filter(m => m.id !== id));
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
        alert("Đang tải file lên, vui lòng đợi...");
        try {
          const res = await uploadFile(file);
          const added = await addPhoneMessage(title, res.url);
          setVoiceMessages([added, ...voiceMessages]);
          alert("Thêm tin nhắn thành công!");
        } catch (err) { alert("Lỗi tải lên!"); }
      }
    };
    fileInput.click();
  };
  const handleEditPhone = async (item) => {
    const title = prompt("Tiêu đề mới:", item.title);
    if (title) {
      const updated = await updatePhoneMessage(item.id, title, item.audio_url);
      setVoiceMessages(voiceMessages.map(m => m.id === item.id ? updated : m));
    }
  };
  const handleDeletePhone = async (id) => {
    if (window.confirm("Xóa lời nhắn này?")) {
      await deletePhoneMessage(id);
      setVoiceMessages(voiceMessages.filter(m => m.id !== id));
    }
  };

  // ---- MUSIC ----
  const handleAddMusic = async () => {
    const title = prompt("Tên bài hát:");
    if (!title) return;
    
    alert("Tiếp theo, hãy chọn file nhạc (MP3)");
    const audioInput = document.createElement('input');
    audioInput.type = 'file';
    audioInput.accept = 'audio/*';
    
    audioInput.onchange = async (e) => {
      const audioFile = e.target.files[0];
      if (!audioFile) return;
      
      alert("Tiếp theo, hãy chọn file ảnh Bìa (Cover)");
      const imageInput = document.createElement('input');
      imageInput.type = 'file';
      imageInput.accept = 'image/*';
      
      imageInput.onchange = async (ev) => {
        const imageFile = ev.target.files[0];
        if (!imageFile) return;
        
        alert("Đang tải dữ liệu lên Server. Vui lòng chờ...");
        try {
          const [audioRes, imageRes] = await Promise.all([
            uploadFile(audioFile),
            uploadFile(imageFile)
          ]);
          const added = await addMusic(title, audioRes.url, imageRes.url);
          setMusicList([added, ...musicList]);
          alert("Thêm bài hát thành công!");
        } catch (err) { alert("Lỗi upload!"); }
      };
      imageInput.click();
    };
    audioInput.click();
  };

  const handleDeleteMusic = async (id) => {
    if (window.confirm("Xóa bài nhạc này?")) {
      await deleteMusic(id);
      setMusicList(musicList.filter(m => m.id !== id));
      if (currentTrack?.id === id) {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    }
  };

  const togglePlayMusic = (track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) audioRef.current.play();
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
          <DraggableItem icon="🧊" label="Tủ Lạnh" initialX={800} initialY={200} dbPosition={itemPositions["Tủ Lạnh"]} onClick={() => setActiveModal("Tủ Lạnh")} />
          <DraggableItem icon="📱" label="Điện Thoại" initialX={700} initialY={500} dbPosition={itemPositions["Điện Thoại"]} onClick={() => setActiveModal("Điện Thoại")} />
          <DraggableItem icon="🐱" label="Bé Mèo" initialX={450} initialY={600} dbPosition={itemPositions["Bé Mèo"]} onClick={() => alert("Meow~")} />
        </>
      )}

      {/* Bedroom Items */}
      {currentFloor === 'bedroom' && (
        <>
          <DraggableItem icon="💌" label="Hòm Thư" initialX={400} initialY={500} dbPosition={itemPositions["Hòm Thư"]} onClick={() => setActiveModal("Thư")} />
          <DraggableItem icon="🎧" label="Máy Nghe Nhạc" initialX={700} initialY={600} dbPosition={itemPositions["Máy Nghe Nhạc"]} onClick={() => setActiveModal("Máy Nghe Nhạc")} />
        </>
      )}

      {/* Rooftop Items */}
      {currentFloor === 'rooftop' && (
        <>
          <DraggableItem icon="🎟️" label="Vé Xem Phim" initialX={400} initialY={350} dbPosition={itemPositions["Vé Xem Phim"]} onClick={() => setActiveModal("Vé Xem Phim")} />
        </>
      )}

      {/* Floor Selector */}
      <div className="floor-selector">
        <button className={`floor-btn ${currentFloor === 'living' ? 'active' : ''}`} onClick={() => setCurrentFloor('living')}>Tầng Khách 🛋️</button>
        <button className={`floor-btn ${currentFloor === 'bedroom' ? 'active' : ''}`} onClick={() => setCurrentFloor('bedroom')}>Tầng Ngủ 🛏️</button>
        <button className={`floor-btn ${currentFloor === 'rooftop' ? 'active' : ''}`} onClick={() => setCurrentFloor('rooftop')}>Tầng Thượng 🌌</button>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === "Thư"} onClose={() => setActiveModal(null)} title="💌 Hòm Thư">
        <textarea 
          className="letter-textarea" 
          value={letterContent}
          onChange={(e) => saveLetter(e.target.value)}
          placeholder="Viết gì đó cho người ấy nha..."
        />
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

      <Modal isOpen={activeModal === "Vé Xem Phim"} onClose={() => setActiveModal(null)} title="🎟️ Lịch sử Vé Xem Phim">
        <button onClick={handleAddMovie} style={{ width: '100%', padding: '10px', marginBottom: '15px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>➕ Thêm Vé Mới</button>
        {movies.map((movie, idx) => (
          <div key={idx} className="movie-ticket" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{movie.title}</strong> - {movie.time}, {movie.date}
            </div>
            <div>
              <button className="action-btn" onClick={() => handleEditMovie(movie)}>✏️</button>
              <button className="action-btn" onClick={() => handleDeleteMovie(movie.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </Modal>

      <Modal isOpen={activeModal === "Điện Thoại"} onClose={() => setActiveModal(null)} title="📱 Lời nhắn thoại">
        <button onClick={handleAddPhone} style={{ width: '100%', padding: '10px', marginBottom: '15px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>➕ Tải lên Lời Nhắn Mới</button>
        {voiceMessages.map((msg, idx) => (
          <div key={idx} style={{ padding: '15px', background: '#fff', borderRadius: '15px', marginBottom: '10px', border: '2px solid var(--pastel-pink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0 }}>▶ {msg.title}</p>
              <div>
                <button className="action-btn" onClick={() => handleEditPhone(msg)}>✏️</button>
                <button className="action-btn" onClick={() => handleDeletePhone(msg.id)}>🗑️</button>
              </div>
            </div>
            <audio controls src={msg.audio_url} style={{ marginTop: '10px', width: '100%' }}></audio>
          </div>
        ))}
      </Modal>

      <Modal isOpen={activeModal === "Máy Nghe Nhạc"} onClose={() => setActiveModal(null)} title="🎧 Máy Nghe Nhạc">
        <div className="vinyl-container">
          <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}>
            <div className="vinyl-grooves"></div>
            <div className="vinyl-cover" style={{ backgroundImage: `url(${currentTrack?.cover_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop'})` }}></div>
            <div className="vinyl-hole"></div>
          </div>
          <h3 style={{ margin: '15px 0 5px 0', color: '#ff6b81' }}>{currentTrack ? currentTrack.title : 'Chưa có nhạc'}</h3>
        </div>

        <button onClick={handleAddMusic} style={{ width: '100%', padding: '10px', marginBottom: '15px', background: 'var(--pastel-pink)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>➕ Upload Bài Hát Mới</button>
        
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {musicList.map((track) => (
            <div key={track.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: currentTrack?.id === track.id ? '#fdfd96' : '#f5f5f5', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={track.cover_url} alt="cover" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <span>{track.title}</span>
              </div>
              <div>
                <button className="action-btn" onClick={() => togglePlayMusic(track)}>
                  {currentTrack?.id === track.id && isPlaying ? '⏸️' : '▶️'}
                </button>
                <button className="action-btn" onClick={() => handleDeleteMusic(track.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

    </div>
  );
};

export default MainRoom;
