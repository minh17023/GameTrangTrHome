import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { toast } from 'react-hot-toast';

const API_HOME = 'https://phimapi.com/danh-sach/phim-moi-cap-nhat';
const API_SEARCH = 'https://phimapi.com/v1/api/tim-kiem?keyword=';
const API_DETAIL = 'https://phimapi.com/phim/';
const IMG_DOMAIN = 'https://phimimg.com/';

// API Bộ lọc
const API_CATES = 'https://phimapi.com/the-loai';
const API_COUNTRIES = 'https://phimapi.com/quoc-gia';
const API_YEARS = 'https://phimapi.com/nam-phat-hanh';
const API_FILTER_BASE = 'https://phimapi.com/v1/api';

const TVModal = ({ isOpen, onClose, user, socket }) => {
  const [view, setView] = useState('home'); // 'home' | 'search' | 'filter'
  const [movies, setMovies] = useState([]); // Cho Home/Filter
  const [heroMovie, setHeroMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Bộ lọc
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [years, setYears] = useState([]);
  const [activeFilterType, setActiveFilterType] = useState(null); // 'the-loai' | 'quoc-gia' | 'nam'
  const [activeFilterValue, setActiveFilterValue] = useState(null); // slug
  const [filterTitle, setFilterTitle] = useState('Phim Mới Cập Nhật');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Tìm kiếm
  const [searchResults, setSearchResults] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Chi tiết & Phát
  const [activeMovie, setActiveMovie] = useState(null); 
  const [activeEpisode, setActiveEpisode] = useState(null); 

  useEffect(() => {
    if (isOpen) {
      if (movies.length === 0) fetchHomeMovies(1);
      if (categories.length === 0) fetchFilterOptions();
    }
  }, [isOpen]);

  // Lắng nghe Socket
  useEffect(() => {
    const handleSync = (data) => {
      if (data.action === 'play_episode') {
        setActiveMovie(data.movie);
        setActiveEpisode(data.episode);
      } else if (data.action === 'view_detail') {
        setActiveMovie(data.movie);
        setActiveEpisode(null);
      } else if (data.action === 'back_to_list') {
        setActiveMovie(null);
        setActiveEpisode(null);
      } else if (data.action === 'close') {
        setActiveMovie(null);
        setActiveEpisode(null);
        onClose();
      }
    };
    socket.on('sync_tv_state', handleSync);
    return () => socket.off('sync_tv_state', handleSync);
  }, [onClose]);

  const fetchFilterOptions = async () => {
    try {
      const [catRes, counRes, yearRes] = await Promise.all([
        fetch(API_CATES).then(r => r.json()),
        fetch(API_COUNTRIES).then(r => r.json()),
        fetch(API_YEARS).then(r => r.json())
      ]);
      setCategories(catRes.data?.items || catRes || []);
      setCountries(counRes.data?.items || counRes || []);
      setYears(yearRes.data?.items || yearRes || []);
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
    }
  };

  const fetchHomeMovies = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_HOME}?page=${page}`);
      const data = await res.json();
      if (data.status && data.items) {
        setMovies(data.items);
        if (data.pagination) {
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
        }
        if (data.items.length > 0 && page === 1) {
          const randomIdx = Math.floor(Math.random() * Math.min(5, data.items.length));
          setHeroMovie(data.items[randomIdx]);
        }
        setFilterTitle('Phim Mới Cập Nhật');
        setView('home');
      }
    } catch (err) {
      console.error("Lỗi lấy phim mới:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (type, item, page = 1) => {
    try {
      setLoading(true);
      let targetValue = activeFilterValue;
      if (item) {
        setActiveFilterType(type);
        targetValue = item.slug || item.name;
        setActiveFilterValue(targetValue);
        setFilterTitle(`${item.name}`);
      }
      
      let endpoint = '';
      if (type === 'the-loai') endpoint = `${API_FILTER_BASE}/the-loai/${targetValue}?page=${page}`;
      else if (type === 'quoc-gia') endpoint = `${API_FILTER_BASE}/quoc-gia/${targetValue}?page=${page}`;
      else if (type === 'nam') endpoint = `${API_FILTER_BASE}/nam/${targetValue}?page=${page}`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.status && data.data?.items) {
        setMovies(data.data.items);
        if (data.data.params?.pagination) {
          setCurrentPage(data.data.params.pagination.currentPage);
          setTotalPages(data.data.params.pagination.totalPages);
        }
        if (page === 1) setHeroMovie(null); // Ẩn banner khi lọc
        setView('filter');
      }
    } catch (err) {
      console.error("Lỗi lọc phim:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (view === 'home') {
      fetchHomeMovies(newPage);
    } else if (view === 'filter') {
      handleFilter(activeFilterType, null, newPage);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      fetchHomeMovies(1);
      return;
    }
    try {
      setLoading(true);
      setView('search');
      setHeroMovie(null);
      const res = await fetch(`${API_SEARCH}${encodeURIComponent(searchKeyword)}&limit=24`);
      const data = await res.json();
      if (data.status === 'success' && data.data?.items) {
        setSearchResults(data.data.items);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (movieParam) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_DETAIL}${movieParam.slug}`);
      const data = await res.json();
      if (data.status && data.movie) {
        const fullMovie = { ...data.movie, episodes: data.episodes };
        setActiveMovie(fullMovie);
        setActiveEpisode(null);
        socket.emit('sync_tv_state', { 
          roomId: user?.room_id, 
          action: 'view_detail',
          movie: fullMovie
        });
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết phim:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayEpisode = (episode) => {
    setActiveEpisode(episode);
    socket.emit('watch_movie', { 
      roomId: user?.room_id, 
      movieTitle: `${activeMovie.name} - ${episode.name}` 
    });
    socket.emit('sync_tv_state', { 
      roomId: user?.room_id, 
      action: 'play_episode',
      movie: activeMovie,
      episode: episode
    });
  };

  const handleClose = () => {
    setActiveMovie(null);
    setActiveEpisode(null);
    socket.emit('sync_tv_state', { roomId: user?.room_id, action: 'close' });
    onClose();
  };

  const getPoster = (movie) => {
    let poster = movie.thumb_url || movie.poster_url;
    if (poster && !poster.startsWith('http')) return IMG_DOMAIN + poster;
    return poster;
  };

  const renderMovieGrid = (list) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', padding: '20px 0' }}>
      {list.map(movie => (
        <div key={movie._id || movie.slug} onClick={() => handleViewDetail(movie)} style={{ cursor: 'pointer', transition: 'transform 0.2s', background: '#222', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <div style={{ width: '100%', aspectRatio: '2/3', background: '#333', position: 'relative' }}>
            <img src={getPoster(movie)} alt={movie.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }} />
          </div>
          <div style={{ padding: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.name}</h4>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.origin_name || movie.year}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" width="1100px" darkTheme={true}>
      <div style={{ background: '#141414', color: 'white', height: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Navbar */}
        <div className="tv-navbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }} className="tv-nav-top">
            <h1 className="tv-logo" style={{ color: '#e50914', margin: 0, fontSize: '1.8rem', cursor: 'pointer' }} onClick={() => fetchHomeMovies(1)}>NETFLIX</h1>
            <button className="tv-close-btn" onClick={handleClose} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
          </div>
          
          {!activeEpisode && !activeMovie && (
            <div className="tv-nav-menu">
              <div style={{ position: 'relative', cursor: 'pointer', fontWeight: 'bold' }} className="nav-item">Thể Loại ▾
                <div className="nav-dropdown" style={{ display: 'none', position: 'absolute', top: '100%', left: '-50px', background: 'rgba(20,20,20,0.95)', border: '1px solid #333', padding: '15px', width: '600px', flexWrap: 'wrap', gap: '10px', borderRadius: '8px' }}>
                  {categories.map(c => <span key={c._id} onClick={() => handleFilter('the-loai', c, 1)} style={{ padding: '8px', fontSize: '0.9rem', width: 'calc(25% - 10px)', textAlign: 'center' }}>{c.name}</span>)}
                </div>
              </div>
              <div style={{ position: 'relative', cursor: 'pointer', fontWeight: 'bold' }} className="nav-item">Quốc Gia ▾
                <div className="nav-dropdown" style={{ display: 'none', position: 'absolute', top: '100%', left: '-50px', background: 'rgba(20,20,20,0.95)', border: '1px solid #333', padding: '15px', width: '600px', flexWrap: 'wrap', gap: '10px', borderRadius: '8px' }}>
                  {countries.map(c => <span key={c._id} onClick={() => handleFilter('quoc-gia', c, 1)} style={{ padding: '8px', fontSize: '0.9rem', width: 'calc(25% - 10px)', textAlign: 'center' }}>{c.name}</span>)}
                </div>
              </div>
              <div style={{ position: 'relative', cursor: 'pointer', fontWeight: 'bold' }} className="nav-item">Năm ▾
                <div className="nav-dropdown" style={{ display: 'none', position: 'absolute', top: '100%', left: '-50px', background: 'rgba(20,20,20,0.95)', border: '1px solid #333', padding: '15px', width: '400px', flexWrap: 'wrap', gap: '10px', borderRadius: '8px' }}>
                  {years.map(y => <span key={y._id} onClick={() => handleFilter('nam', y, 1)} style={{ padding: '8px', fontSize: '0.9rem', width: 'calc(25% - 10px)', textAlign: 'center' }}>{y.name}</span>)}
                </div>
              </div>

              <form className="tv-search-form" onSubmit={handleSearch} style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', border: '1px solid #fff', borderRadius: '4px', overflow: 'hidden' }}>
                <input 
                  type="text" 
                  placeholder="Phim, diễn viên..." 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'white', padding: '5px 10px', outline: 'none', width: '100%' }}
                />
                <button type="submit" style={{ background: 'transparent', border: 'none', color: 'white', padding: '5px 10px', cursor: 'pointer' }}>🔍</button>
              </form>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="tv-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '30px', position: 'relative' }}>
          {loading && <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '20px', zIndex: 100 }}>Đang tải dữ liệu...</div>}

          {/* Player View */}
          {activeEpisode ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ background: 'black', position: 'relative', width: '100%', flex: 1, minHeight: '500px' }}>
                <iframe 
                  src={activeEpisode.link_embed}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  title="Player"
                ></iframe>
              </div>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0 }}>{activeMovie.name} - {activeEpisode.name}</h2>
                <button onClick={() => setActiveEpisode(null)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Quay Lại Chi Tiết</button>
              </div>
            </div>
          ) : activeMovie ? (
            /* Detail View */
            <div>
              <div style={{ position: 'relative', height: '50vh', background: `url(${getPoster(activeMovie)}) center/cover no-repeat` }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, #141414 20%, transparent 60%), linear-gradient(to top, #141414 5%, transparent 40%)' }} />
                <div style={{ position: 'absolute', bottom: '10%', left: '40px', maxWidth: '50%' }}>
                  <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{activeMovie.name}</h1>
                  <p style={{ color: '#ccc', fontSize: '1.2rem', marginBottom: '20px' }}>{activeMovie.origin_name} ({activeMovie.year})</p>
                  <button onClick={() => setActiveMovie(null)} style={{ padding: '10px 25px', background: 'rgba(109, 109, 110, 0.7)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    ⬅ Trở về
                  </button>
                </div>
              </div>
              <div style={{ padding: '0 40px' }}>
                <p dangerouslySetInnerHTML={{ __html: activeMovie.content }} style={{ lineHeight: '1.6', color: '#ccc', maxWidth: '800px', fontSize: '1.1rem' }} />
                
                <h3 style={{ marginTop: '30px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Chọn Tập</h3>
                {activeMovie.episodes?.map((server, idx) => (
                  <div key={idx} style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#999' }}>{server.server_name}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {server.server_data.map(ep => (
                        <button key={ep.slug} onClick={() => handlePlayEpisode(ep)} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onMouseEnter={(e)=>e.target.style.background='white'} onMouseLeave={(e)=>e.target.style.background='#333'} onMouseOver={(e)=>e.target.style.color='black'} onMouseOut={(e)=>e.target.style.color='white'}>
                          {ep.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Home & List View */
            <div>
              {heroMovie && view === 'home' && currentPage === 1 && !loading && (
                <div className="tv-hero" style={{ position: 'relative', height: '60vh', marginBottom: '20px', background: `url(${getPoster(heroMovie)}) center/cover no-repeat` }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, #141414 10%, rgba(0,0,0,0.4) 50%, #141414 90%), linear-gradient(to top, #141414 0%, transparent 30%)' }} />
                  <div className="tv-hero-content" style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '80%' }}>
                    <h1 className="tv-hero-title" style={{ fontSize: '3rem', margin: '0 0 15px 0', textShadow: '2px 2px 5px black' }}>{heroMovie.name}</h1>
                    <button onClick={() => handleViewDetail(heroMovie)} style={{ padding: '12px 35px', background: 'white', color: 'black', border: 'none', borderRadius: '4px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }} onMouseEnter={(e)=>e.target.style.background='rgba(255,255,255,0.8)'} onMouseLeave={(e)=>e.target.style.background='white'}>
                      ▶ Thông tin
                    </button>
                  </div>
                </div>
              )}
              
              <div className="tv-movie-list" style={{ padding: '0 40px' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#e5e5e5' }}>
                  {view === 'search' ? `Kết quả tìm kiếm cho: "${searchKeyword}"` : filterTitle}
                </h2>
                
                {!loading && (
                  view === 'search' && searchResults.length === 0 ? 
                  <p>Không tìm thấy phim nào.</p> :
                  renderMovieGrid(view === 'search' ? searchResults : movies)
                )}

                {/* Pagination */}
                {view !== 'search' && totalPages > 1 && !loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '20px' }}>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ padding: '10px 20px', background: currentPage === 1 ? '#333' : '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ⬅ Trước
                    </button>
                    <span style={{ fontSize: '1.2rem' }}>Trang {currentPage} / {totalPages}</span>
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{ padding: '10px 20px', background: currentPage === totalPages ? '#333' : '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Sau ➡
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TVModal;
