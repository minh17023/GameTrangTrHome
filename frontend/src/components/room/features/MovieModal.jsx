import React, { useState } from 'react';
import Modal from '../../common/Modal';
import ConfirmDialog from '../../common/ConfirmDialog';
import { addMovie, updateMovie, deleteMovie } from '../../../api/movieApi';
import { toast } from 'react-hot-toast';

const MovieModal = ({ isOpen, onClose, movies, setMovies, user, socket }) => {
  const [isMovieFormOpen, setIsMovieFormOpen] = useState(false);
  const [movieForm, setMovieForm] = useState({ id: null, title: '', date: '', time: '' });
  const [movieToDelete, setMovieToDelete] = useState(null);

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

  const handleDeleteMovie = async () => {
    if (!movieToDelete) return;
    await deleteMovie(movieToDelete);
    setMovies(movies.filter(m => m.id !== movieToDelete));
    setMovieToDelete(null);
    socket.emit('data_changed', { type: 'movie', roomId: user.room_id });
  };

  const handleClose = () => {
    onClose();
    setIsMovieFormOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🎟️ Lịch sử Vé Xem Phim">
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
                  <button className="action-btn" onClick={() => setMovieToDelete(movie.id)}>🗑️</button>
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

      <ConfirmDialog 
        isOpen={!!movieToDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa vé xem phim này không?"
        onConfirm={handleDeleteMovie}
        onCancel={() => setMovieToDelete(null)}
      />
    </Modal>
  );
};

export default MovieModal;
