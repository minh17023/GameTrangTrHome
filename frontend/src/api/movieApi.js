import { fetchApi } from './apiClient';

export const getMovies = () => fetchApi('/movies');

export const addMovie = (title, time, date) => fetchApi('/movies', {
  method: 'POST',
  body: JSON.stringify({ title, time, date }),
});

export const updateMovie = (id, title, time, date) => fetchApi(`/movies/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ title, time, date }),
});

export const deleteMovie = (id) => fetchApi(`/movies/${id}`, {
  method: 'DELETE',
});
