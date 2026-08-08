import { fetchApi } from './apiClient';

export const getMusic = () => fetchApi('/music');

export const addMusic = (title, url, cover_url) => fetchApi('/music', {
  method: 'POST',
  body: JSON.stringify({ title, url, cover_url }),
});

export const updateMusic = (id, title, url, cover_url) => fetchApi(`/music/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ title, url, cover_url }),
});

export const deleteMusic = (id) => fetchApi(`/music/${id}`, {
  method: 'DELETE',
});
