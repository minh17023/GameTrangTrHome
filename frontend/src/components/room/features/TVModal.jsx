import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { toast } from 'react-hot-toast';

// Sử dụng key TMDB xịn
const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const fallbackMovies = [
  { id: 299534, title: 'Avengers: Endgame', poster_path: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg' },
  { id: 19995, title: 'Avatar', poster_path: '/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg' },
  { id: 24428, title: 'The Avengers', poster_path: '/RYMX2wcKCBAr24UyPD7xwmja8y.jpg' },
  { id: 27205, title: 'Inception', poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg' },
  { id: 157336, title: 'Interstellar', poster_path: '/gEU2QlsUUHXjNpeVD8kUvT8OM49.jpg' },
  { id: 597, title: 'Titanic', poster_path: '/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg' },
  { id: 315162, title: 'Puss in Boots: The Last Wish', poster_path: '/kuf6dutpsT0vSVehic3EZIqkOBt.jpg' },
  { id: 502356, title: 'The Super Mario Bros. Movie', poster_path: '/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg' },
];

const TVModal = ({ isOpen, onClose, user, socket }) => {
  const [movies, setMovies] = useState([]);
  const [activeMovie, setActiveMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMovies();
    }
  }, [isOpen]);

  // Lắng nghe sự kiện đồng bộ từ nửa kia
  useEffect(() => {
    const handleSync = (data) => {
      if (data.action === 'play') {
        setActiveMovie(data.movie);
      } else if (data.action === 'back') {
        setActiveMovie(null);
      }
    };
    socket.on('sync_tv_state', handleSync);
    return () => socket.off('sync_tv_state', handleSync);
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=vi-VN`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setMovies(data.results);
      } else {
        setMovies(fallbackMovies);
      }
    } catch (err) {
      console.error("Lỗi lấy phim:", err);
      setMovies(fallbackMovies);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMovie = (movie) => {
    setActiveMovie(movie);
    // Gửi thông báo realtime
    socket.emit('watch_movie', { 
      roomId: user?.room_id, 
      movieTitle: movie.title || movie.name 
    });
    // Đồng bộ thao tác chọn phim
    socket.emit('sync_tv_state', { 
      roomId: user?.room_id, 
      action: 'play',
      movie: movie
    });
    toast.success(`Đang mở phim: ${movie.title || movie.name}`, { icon: '🍿' });
  };

  const handleClose = () => {
    setActiveMovie(null);
    socket.emit('sync_tv_state', { roomId: user?.room_id, action: 'close' });
    onClose();
  };

  const handleBackToList = () => {
    setActiveMovie(null);
    socket.emit('sync_tv_state', { roomId: user?.room_id, action: 'back' });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🍿 Rạp Phim Tại Gia" width="900px">
      <div style={{ background: '#141414', color: 'white', borderRadius: '10px', overflow: 'hidden', padding: '20px', minHeight: '60vh' }}>
        
        {activeMovie ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#e50914' }}>{activeMovie.title || activeMovie.name}</h2>
              <button 
                onClick={handleBackToList} 
                style={{ padding: '8px 15px', background: 'transparent', border: '1px solid white', color: 'white', borderRadius: '5px', cursor: 'pointer' }}
              >
                ⬅ Quay lại danh sách
              </button>
            </div>
            
            <div style={{ flex: 1, background: 'black', borderRadius: '10px', overflow: 'hidden', position: 'relative', paddingBottom: '56.25%' }}>
              {/* Iframe chiếu phim từ vidsrc.me */}
              <iframe 
                src={`https://vidsrc.me/embed/movie?tmdb=${activeMovie.id}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
                title="Movie Player"
              ></iframe>
            </div>
            <p style={{ marginTop: '10px', color: '#999', fontSize: '0.9rem', textAlign: 'center' }}>
              Lưu ý: Vì lý do bảo mật của trình duyệt, không thể tự động đồng bộ Tua/Dừng phim. Hai bạn hãy cùng bấm Play nhé!
            </p>
          </div>
        ) : (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#e50914', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Phim Thịnh Hành</h2>
            {loading ? (
              <p style={{ textAlign: 'center' }}>Đang tải danh sách phim...</p>
            ) : (
              <div style={{ 
                display: 'flex', 
                gap: '15px',
                overflowX: 'auto',
                paddingBottom: '20px',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}>
                {movies.map(movie => (
                  <div 
                    key={movie.id} 
                    onClick={() => handlePlayMovie(movie)}
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'transform 0.3s ease',
                      flex: '0 0 auto',
                      width: '180px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.zIndex = 10;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = 1;
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '2/3', background: '#222', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                      <img 
                        src={`${IMG_BASE_URL}${movie.poster_path}`} 
                        alt={movie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
                      />
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {movie.title || movie.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TVModal;
